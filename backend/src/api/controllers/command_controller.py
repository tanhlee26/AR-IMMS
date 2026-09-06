"""Operational APIs consumed by the Web Command Center and collector agents."""
from datetime import datetime, timedelta
import json
from flask import Blueprint, request

from api.responses import success_response, error_response
from infrastructure.databases import db
from infrastructure.models import (
    SiteModel, RoomModel, RackModel, NodeModel, TelemetryMetricModel,
    AlertModel, TicketModel, AuditLogModel, UserModel,
)

command_api = Blueprint("command_api", __name__, url_prefix="/api/v1")


def iso(value):
    return value.isoformat() + "Z" if value else None


def audit(action, entity, entity_id, details=None):
    db.session.add(AuditLogModel(
        user_id=1, username="operator", action=action,
        target_entity=entity, target_id=str(entity_id),
        details_json=json.dumps(details or {}, ensure_ascii=False),
        ip_address=request.remote_addr,
    ))


def latest_metrics(node_id):
    result = {}
    rows = (TelemetryMetricModel.query.filter_by(node_id=node_id)
            .order_by(TelemetryMetricModel.timestamp.desc()).limit(40).all())
    for row in rows:
        result.setdefault(row.metric_type, row.value)
    return result


def node_json(node):
    metrics = latest_metrics(node.id)
    status = {"ONLINE": "healthy", "WARNING": "warning", "CRITICAL": "critical", "OFFLINE": "offline"}.get(node.status, node.status.lower())
    return {
        "id": node.id, "code": f"SV-{node.id:02d}", "name": node.name,
        "hostname": node.hostname, "ip": node.ip_address,
        "rackId": node.rack_id, "rack": node.rack.name,
        "status": status, "lastSeen": iso(node.last_ping_at),
        "cpu": metrics.get("CPU_USAGE", 0), "ram": metrics.get("RAM_USAGE", 0),
        "temp": metrics.get("TEMPERATURE", 0),
        "disk": metrics.get("DISK_USAGE", 0),
        "power": metrics.get("POWER_USAGE", node.power_consumption_watts),
    }


def alert_json(item):
    node = db.session.get(NodeModel, item.node_id)
    labels = {"OPEN": "Chưa xử lý", "ACKNOWLEDGED": "Đã xác nhận", "RESOLVED": "Đã giải quyết", "CLOSED": "Đã đóng"}
    return {"id": item.id, "code": f"ALT-{2000 + item.id}", "nodeId": item.node_id,
            "source": node.name if node else "Unknown", "severity": item.severity.title(),
            "type": item.alert_type, "message": item.message, "value": item.metric_value,
            "status": item.status, "state": labels.get(item.status, item.status),
            "triggeredAt": iso(item.triggered_at), "acknowledgedAt": iso(item.acknowledged_at)}


def ticket_json(item):
    node = db.session.get(NodeModel, item.node_id)
    user = db.session.get(UserModel, item.assigned_to_user_id) if item.assigned_to_user_id else None
    return {"id": item.id, "code": f"TKT-{1000 + item.id}", "alertId": item.alert_id,
            "nodeId": item.node_id, "node": node.name if node else "Unknown", "title": item.title,
            "description": item.description, "priority": item.priority, "status": item.status,
            "assignee": user.full_name if user else "Chưa phân công",
            "assignedTo": item.assigned_to_user_id, "createdAt": iso(item.created_at), "updatedAt": iso(item.updated_at)}


@command_api.get("/dashboard")
def dashboard():
    nodes = NodeModel.query.order_by(NodeModel.id).all()
    node_data = [node_json(n) for n in nodes]
    active = [n for n in node_data if n["status"] != "offline"]
    alerts = AlertModel.query.order_by(AlertModel.triggered_at.desc()).limit(5).all()
    total_it = sum(n["power"] for n in node_data) / 1000
    pue = 1.42
    return success_response({
        "nodes": node_data, "alerts": [alert_json(a) for a in alerts],
        "summary": {"activeNodes": len(active), "totalNodes": len(nodes),
                    "avgCpu": round(sum(n["cpu"] for n in active) / max(len(active), 1), 1),
                    "maxTemp": max([n["temp"] for n in active] or [0]), "pue": pue,
                    "openAlerts": AlertModel.query.filter(AlertModel.status.in_(["OPEN", "ACKNOWLEDGED"])).count()},
        "energy": {"pue": pue, "itPowerKw": round(total_it, 2), "totalPowerKw": round(total_it * pue, 2)},
    })


@command_api.get("/hierarchy")
def hierarchy():
    sites = []
    for site in SiteModel.query.order_by(SiteModel.id).all():
        sites.append({"id": site.id, "name": site.name, "code": site.code, "location": site.location,
          "rooms": [{"id": room.id, "name": room.name, "code": room.code,
            "racks": [{"id": rack.id, "name": rack.name, "code": rack.code,
              "capacity": rack.unit_capacity, "nodes": [node_json(n) for n in rack.nodes]} for rack in room.racks]} for room in site.rooms]})
    return success_response(sites)


@command_api.get("/nodes/<int:node_id>/telemetry")
def telemetry_history(node_id):
    minutes = min(max(request.args.get("minutes", 15, type=int), 1), 1440)
    since = datetime.utcnow() - timedelta(minutes=minutes)
    rows = (TelemetryMetricModel.query.filter(TelemetryMetricModel.node_id == node_id,
            TelemetryMetricModel.timestamp >= since).order_by(TelemetryMetricModel.timestamp).all())
    series = {}
    for row in rows:
        series.setdefault(row.metric_type, []).append({"value": row.value, "unit": row.unit, "timestamp": iso(row.timestamp)})
    node = db.session.get(NodeModel, node_id)
    if not node: return error_response("Node không tồn tại", "NOT_FOUND", 404)
    return success_response({"node": node_json(node), "series": series})


@command_api.post("/telemetry")
def ingest_telemetry():
    payload = request.get_json(silent=True) or {}
    node_id = payload.get("node_id") or request.headers.get("X-Node-ID", type=int)
    node = db.session.get(NodeModel, node_id)
    if not node: return error_response("Node không tồn tại", "NOT_FOUND", 404)
    raw = payload.get("metrics", {})
    name_map = {"cpu_usage_percent": ("CPU_USAGE", "%"), "memory_usage_percent": ("RAM_USAGE", "%"),
                "disk_usage_percent": ("DISK_USAGE", "%"), "temperature_celsius": ("TEMPERATURE", "°C"),
                "network_rx_kbps": ("NETWORK_RX", "KB/s"), "network_tx_kbps": ("NETWORK_TX", "KB/s"),
                "power_usage_watts": ("POWER_USAGE", "W")}
    count = 0
    iterable = raw.items() if isinstance(raw, dict) else [(m.get("type"), m.get("value")) for m in raw]
    for key, value in iterable:
        if key in name_map and isinstance(value, (int, float)):
            metric_type, unit = name_map[key]
        elif isinstance(raw, list):
            metric_type, unit = str(key).upper(), ""
        else: continue
        db.session.add(TelemetryMetricModel(node_id=node.id, metric_type=metric_type, value=float(value), unit=unit))
        count += 1
        if metric_type == "CPU_USAGE" and value >= 90:
            existing = AlertModel.query.filter_by(node_id=node.id, alert_type="CPU_USAGE", status="OPEN").first()
            if not existing:
                db.session.add(AlertModel(node_id=node.id, alert_type="CPU_USAGE", severity="CRITICAL", message="CPU vượt ngưỡng 90%", metric_value=value))
                node.status = "CRITICAL"
    node.last_ping_at = datetime.utcnow()
    if node.status == "OFFLINE": node.status = "ONLINE"
    db.session.commit()
    return success_response({"acceptedMetrics": count}, "Telemetry đã được ghi nhận", 201)


@command_api.get("/alerts")
def list_alerts():
    query = AlertModel.query
    status = request.args.get("status")
    if status: query = query.filter_by(status=status.upper())
    return success_response([alert_json(a) for a in query.order_by(AlertModel.triggered_at.desc()).all()])


@command_api.patch("/alerts/<int:alert_id>/acknowledge")
def acknowledge_alert(alert_id):
    item = db.session.get(AlertModel, alert_id)
    if not item: return error_response("Cảnh báo không tồn tại", "NOT_FOUND", 404)
    item.status, item.acknowledged_at, item.acknowledged_by_user_id = "ACKNOWLEDGED", datetime.utcnow(), 1
    audit("ALERT_ACKNOWLEDGED", "alert", item.id, {"message": item.message})
    db.session.commit()
    return success_response(alert_json(item), "Đã xác nhận cảnh báo")


@command_api.get("/tickets")
def list_tickets():
    return success_response([ticket_json(t) for t in TicketModel.query.order_by(TicketModel.updated_at.desc()).all()])


@command_api.post("/tickets")
def create_ticket():
    data = request.get_json(silent=True) or {}
    if not data.get("node_id") or not data.get("title"): return error_response("Thiếu node_id hoặc title", "VALIDATION_ERROR", 422)
    item = TicketModel(node_id=data["node_id"], alert_id=data.get("alert_id"), title=data["title"],
        description=data.get("description", ""), priority=data.get("priority", "MEDIUM").upper(),
        assigned_to_user_id=data.get("assigned_to_user_id"), created_by_user_id=1)
    db.session.add(item); db.session.flush(); audit("TICKET_CREATED", "ticket", item.id, {"title": item.title}); db.session.commit()
    return success_response(ticket_json(item), "Đã tạo ticket", 201)


@command_api.patch("/tickets/<int:ticket_id>")
def update_ticket(ticket_id):
    item = db.session.get(TicketModel, ticket_id)
    if not item: return error_response("Ticket không tồn tại", "NOT_FOUND", 404)
    data = request.get_json(silent=True) or {}
    for source, target in [("status", "status"), ("priority", "priority"), ("assigned_to_user_id", "assigned_to_user_id")]:
        if source in data: setattr(item, target, data[source].upper() if source in ("status", "priority") else data[source])
    item.updated_at = datetime.utcnow(); audit("TICKET_UPDATED", "ticket", item.id, data); db.session.commit()
    return success_response(ticket_json(item), "Đã cập nhật ticket")


@command_api.get("/reports/pue")
def pue_report():
    points = [{"hour": f"{h:02d}:00", "pue": round(1.37 + ((h * 7) % 9) / 100, 2), "itKwh": round(14 + (h % 5) * .8, 1)} for h in range(0, 24, 2)]
    avg = round(sum(x["pue"] for x in points) / len(points), 2)
    return success_response({"current": points[-1]["pue"], "average": avg, "target": 1.5, "points": points,
      "summary": {"totalEnergyKwh": 297.6, "itEnergyKwh": 209.6, "coolingEnergyKwh": 88.0, "carbonKg": 128.4}})


@command_api.get("/audit-logs")
def audit_logs():
    rows = AuditLogModel.query.order_by(AuditLogModel.timestamp.desc()).limit(100).all()
    return success_response([{"id": r.id, "username": r.username, "action": r.action, "entity": r.target_entity,
      "targetId": r.target_id, "details": json.loads(r.details_json or "{}"), "ip": r.ip_address, "timestamp": iso(r.timestamp)} for r in rows])
