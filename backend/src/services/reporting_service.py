"""
AR-IMMS Tầng Nghiệp vụ Service - Dịch vụ Báo cáo & Thống kê MTTR, PUE (Reporting Service)
Cung cấp các chỉ số hiệu suất vận hành (KPIs) Data Center:
- MTTR (Mean Time to Repair / Resolve): Thời gian trung bình khắc phục sự cố.
- PUE (Power Usage Effectiveness): Hiệu quả sử dụng năng lượng hạ tầng Data Center.
- Dashboard KPI Summary: Tổng quan điều hành toàn hệ thống.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from infrastructure.databases import db
from infrastructure.models import (
    TicketModel, AlertModel, NodeModel, RackModel, RoomModel, SiteModel,
    TelemetryMetricModel, MaintenanceHistoryModel
)
from infrastructure.repositories.telemetry_repository import TelemetryRepository

class ReportingService:
    def __init__(self):
        self.telemetry_repo = TelemetryRepository()

    # =========================================================================
    # 1. BÁO CÁO MTTR (MEAN TIME TO RESOLVE / REPAIR)
    # =========================================================================
    def calculate_mttr(self, days: int = 30) -> Dict[str, Any]:
        """
        Tính toán chỉ số MTTR (Mean Time to Resolve) dựa trên các Ticket và Alert đã đóng.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Lấy danh sách toàn bộ Ticket trong khoảng thời gian
        all_tickets = TicketModel.query.filter(TicketModel.created_at >= cutoff_date).all()
        closed_tickets = [t for t in all_tickets if t.status == "CLOSED"]

        resolution_times_seconds = []
        priority_breakdown = {
            "CRITICAL": {"total": 0, "closed": 0, "durations": []},
            "HIGH": {"total": 0, "closed": 0, "durations": []},
            "MEDIUM": {"total": 0, "closed": 0, "durations": []},
            "LOW": {"total": 0, "closed": 0, "durations": []}
        }

        for t in all_tickets:
            p = t.priority if t.priority in priority_breakdown else "MEDIUM"
            priority_breakdown[p]["total"] += 1

            if t.status == "CLOSED":
                priority_breakdown[p]["closed"] += 1
                # Thời gian đóng: từ closure_request hoặc updated_at
                end_time = t.updated_at
                if t.closure_request and t.closure_request.reviewed_at:
                    end_time = t.closure_request.reviewed_at
                
                duration = max(1.0, (end_time - t.created_at).total_seconds())
                resolution_times_seconds.append(duration)
                priority_breakdown[p]["durations"].append(duration)

        total_closed = len(closed_tickets)
        total_tickets = len(all_tickets)

        avg_mttr_seconds = (sum(resolution_times_seconds) / total_closed) if total_closed > 0 else 0.0
        avg_mttr_minutes = round(avg_mttr_seconds / 60.0, 2)
        avg_mttr_hours = round(avg_mttr_seconds / 3600.0, 2)

        fastest_minutes = round(min(resolution_times_seconds) / 60.0, 2) if resolution_times_seconds else 0.0
        slowest_minutes = round(max(resolution_times_seconds) / 60.0, 2) if resolution_times_seconds else 0.0

        resolution_rate = round((total_closed / total_tickets * 100.0), 2) if total_tickets > 0 else 100.0

        # Phân tích theo từng mức độ ưu tiên
        priorities_result = {}
        for p, data in priority_breakdown.items():
            cnt = len(data["durations"])
            p_avg_min = round((sum(data["durations"]) / cnt / 60.0), 2) if cnt > 0 else 0.0
            priorities_result[p] = {
                "total_tickets": data["total"],
                "closed_tickets": data["closed"],
                "mttr_minutes": p_avg_min
            }

        # Tính toán MTTR cấp Alert (Thời gian từ khi cảnh báo kích hoạt đến khi tự giải tỏa/giải quyết)
        resolved_alerts = AlertModel.query.filter(
            AlertModel.triggered_at >= cutoff_date,
            AlertModel.status == "RESOLVED",
            AlertModel.resolved_at.isnot(None)
        ).all()

        alert_durations = [
            max(1.0, (a.resolved_at - a.triggered_at).total_seconds())
            for a in resolved_alerts
        ]
        alert_mttr_minutes = round((sum(alert_durations) / len(alert_durations) / 60.0), 2) if alert_durations else 0.0

        # Ước tính MTBF (Mean Time Between Failures): Tổng thời gian vận hành / Tổng số sự cố
        # Giả định 4 nút máy chủ chạy 24h * số ngày
        node_count = max(1, NodeModel.query.count())
        total_operational_hours = node_count * 24.0 * days
        failure_count = max(1, len(resolved_alerts) + total_tickets)
        mtbf_hours = round(total_operational_hours / failure_count, 1)

        return {
            "period_days": days,
            "total_tickets": total_tickets,
            "closed_tickets": total_closed,
            "open_tickets": total_tickets - total_closed,
            "resolution_rate_percent": resolution_rate,
            "mttr": {
                "seconds": round(avg_mttr_seconds, 1),
                "minutes": avg_mttr_minutes,
                "hours": avg_mttr_hours,
                "fastest_resolution_minutes": fastest_minutes,
                "slowest_resolution_minutes": slowest_minutes
            },
            "alert_level_mttr_minutes": alert_mttr_minutes,
            "mtbf_hours": mtbf_hours,
            "priority_breakdown": priorities_result
        }

    # =========================================================================
    # 2. BÁO CÁO PUE (POWER USAGE EFFECTIVENESS)
    # =========================================================================
    def calculate_pue(self) -> Dict[str, Any]:
        """
        Tính toán chỉ số PUE (Power Usage Effectiveness) chuẩn quốc tế (The Green Grid / ISO/IEC 30134-2).
        PUE = Tổng Công suất Hạ tầng (Total Facility Power) / Công suất Thiết bị IT (IT Equipment Power).
        """
        nodes = NodeModel.query.all()
        total_nodes = len(nodes)
        online_nodes = [n for n in nodes if n.status != "UNAVAILABLE"]

        # 1. Tính toán IT Equipment Power (Watts)
        it_power_watts = 0.0
        temperatures = []

        for node in online_nodes:
            base_watts = node.power_consumption_watts if node.power_consumption_watts and node.power_consumption_watts > 0 else 150.0
            
            # Đọc telemetry mới nhất để tính tải CPU tác động đến công suất
            latest_metrics = self.telemetry_repo.get_latest_metrics_by_node(node.id)
            cpu_usage = latest_metrics.get("cpu_usage_percent", 25.0)
            temp = latest_metrics.get("temperature_celsius", 45.0)
            temperatures.append(temp)

            # Mô hình điện năng tiêu thụ thực tế theo tải CPU:
            # Idle = 65% công suất danh định, Full load 100% = 100% công suất danh định
            real_node_watts = base_watts * (0.65 + 0.35 * (cpu_usage / 100.0))
            it_power_watts += real_node_watts

        # Dự phòng nếu chưa có node nào online
        if it_power_watts <= 0.0:
            it_power_watts = 150.0

        avg_temperature = (sum(temperatures) / len(temperatures)) if temperatures else 42.0

        # 2. Tính toán Phụ tải Hạ tầng (Cooling, UPS & Lighting Overhead)
        # Hệ số làm mát (Cooling load factor) phụ thuộc vào nhiệt độ phòng/máy chủ
        base_cooling_factor = 0.22
        if avg_temperature > 50.0:
            thermal_penalty = (avg_temperature - 50.0) * 0.006
            base_cooling_factor += thermal_penalty

        ups_loss_factor = 0.07  # Tổn hao bộ lưu điện UPS & phân phối điện (PDU)
        lighting_overhead_watts = 25.0  # Đèn chiếu sáng & thiết bị phụ trợ phòng máy

        cooling_power_watts = it_power_watts * base_cooling_factor
        ups_loss_watts = it_power_watts * ups_loss_factor
        total_facility_power_watts = it_power_watts + cooling_power_watts + ups_loss_watts + lighting_overhead_watts

        # 3. Tính toán PUE
        pue_value = round(total_facility_power_watts / it_power_watts, 3)

        # 4. Đánh giá Hiệu quả Năng lượng (PUE Energy Rating)
        if pue_value <= 1.2:
            rating = "XUẤT SẮC"
            rating_description = "Hạ tầng đạt chuẩn Green Data Center (Cực kỳ tiết kiệm điện năng)."
        elif pue_value <= 1.4:
            rating = "TỐT"
            rating_description = "Hệ thống làm mát và phân phối điện hoạt động hiệu quả cao."
        elif pue_value <= 1.7:
            rating = "TRUNG BÌNH"
            rating_description = "Mức tiêu thụ năng lượng ở ngưỡng chấp nhận được của trung tâm dữ liệu tiêu chuẩn."
        else:
            rating = "KÉM HIỆU QUẢ"
            rating_description = "Hệ thống tản nhiệt hoạt động quá tải hoặc hiệu suất chuyển đổi điện năng thấp."

        # 5. Ước tính Tiêu thụ Điện năng (kWh) và Chi phí hàng tháng (ước tính giá điện 2.000 VNĐ / kWh)
        it_kw = round(it_power_watts / 1000.0, 3)
        facility_kw = round(total_facility_power_watts / 1000.0, 3)
        daily_kwh = round(facility_kw * 24.0, 2)
        monthly_kwh = round(daily_kwh * 30.0, 2)
        estimated_monthly_cost_vnd = int(monthly_kwh * 2000)

        # 6. Phân tích chi tiết theo Rack
        racks = RackModel.query.all()
        rack_breakdowns = []
        for r in racks:
            rack_nodes = [n for n in online_nodes if n.rack_id == r.id]
            rack_it_watts = sum(n.power_consumption_watts or 150.0 for n in rack_nodes)
            rack_capacity = r.total_power_capacity_watts or 5000.0
            usage_pct = round((rack_it_watts / rack_capacity * 100.0), 1) if rack_capacity > 0 else 0.0

            rack_breakdowns.append({
                "rack_id": r.id,
                "rack_name": r.name,
                "node_count": len(rack_nodes),
                "power_consumption_watts": round(rack_it_watts, 1),
                "power_capacity_watts": rack_capacity,
                "capacity_usage_percent": usage_pct
            })

        return {
            "pue": pue_value,
            "rating": rating,
            "rating_description": rating_description,
            "average_temperature_celsius": round(avg_temperature, 1),
            "power_metrics": {
                "it_equipment_watts": round(it_power_watts, 1),
                "it_equipment_kw": it_kw,
                "cooling_overhead_watts": round(cooling_power_watts, 1),
                "ups_loss_watts": round(ups_loss_watts, 1),
                "total_facility_power_watts": round(total_facility_power_watts, 1),
                "total_facility_power_kw": facility_kw
            },
            "energy_estimates": {
                "daily_consumption_kwh": daily_kwh,
                "monthly_consumption_kwh": monthly_kwh,
                "estimated_monthly_cost_vnd": estimated_monthly_cost_vnd
            },
            "nodes_summary": {
                "total_nodes": total_nodes,
                "active_monitored_nodes": len(online_nodes)
            },
            "racks_breakdown": rack_breakdowns
        }

    # =========================================================================
    # 3. BÁO CÁO TỔNG QUAN HỆ THỐNG (DASHBOARD KPI OVERVIEW)
    # =========================================================================
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """
        Trích xuất bộ chỉ số KPI tổng thể dành cho Giám đốc Vận hành / Màn hình Web Command Center.
        """
        nodes = NodeModel.query.all()
        total_nodes = len(nodes)
        online_count = sum(1 for n in nodes if n.status == "ONLINE")
        warning_count = sum(1 for n in nodes if n.status == "WARNING")
        critical_count = sum(1 for n in nodes if n.status == "CRITICAL")
        unavailable_count = sum(1 for n in nodes if n.status == "UNAVAILABLE")

        active_alerts = AlertModel.query.filter(AlertModel.status.in_(["OPEN", "ACKNOWLEDGED"])).count()
        open_tickets = TicketModel.query.filter(TicketModel.status.in_(["OPEN", "IN_PROGRESS", "PENDING_CLOSURE"])).count()

        pue_data = self.calculate_pue()
        mttr_data = self.calculate_mttr(days=30)

        # Tính tỷ lệ Uptime hệ thống
        uptime_rate = round(((total_nodes - unavailable_count) / total_nodes * 100.0), 2) if total_nodes > 0 else 100.0

        return {
            "system_uptime_percent": uptime_rate,
            "nodes": {
                "total": total_nodes,
                "online": online_count,
                "warning": warning_count,
                "critical": critical_count,
                "unavailable": unavailable_count
            },
            "active_alerts_count": active_alerts,
            "open_tickets_count": open_tickets,
            "pue": {
                "current_pue": pue_data["pue"],
                "rating": pue_data["rating"],
                "it_power_kw": pue_data["power_metrics"]["it_equipment_kw"],
                "facility_power_kw": pue_data["power_metrics"]["total_facility_power_kw"]
            },
            "mttr": {
                "average_hours": mttr_data["mttr"]["hours"],
                "resolution_rate_percent": mttr_data["resolution_rate_percent"]
            },
            "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }

