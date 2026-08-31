"""
AR-IMMS Hạ tầng Core - Cổng Kết nối WebSocket / Socket.IO Gateway
Cung cấp dịch vụ phát truyền dữ liệu hai chiều thời gian thực cho Collector Agent, Web Command Center và Mobile AR App.
"""
from typing import Dict, Any
from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room

# Khởi tạo đối tượng SocketIO dùng chung cho toàn bộ ứng dụng
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading", logger=False, engineio_logger=False)

def init_websocket(app):
    """Khởi tạo SocketIO với ứng dụng Flask context."""
    socketio.init_app(app)
    return socketio

# Bộ xử lý sự kiện kết nối WebSocket (SocketIO Event Handlers)
@socketio.on("connect")
def handle_connect():
    """Xử lý sự kiện khi có Client kết nối tới WebSocket Gateway."""
    client_id = request.sid
    client_type = request.args.get("client_type", "unknown")
    print(f"[WebSocket Gateway] Client đã kết nối: {client_id} (Loại: {client_type})")
    
    # Tự động phân luồng phòng (rooms) theo loại client
    if client_type == "web_dashboard":
        join_room("dashboard")
        print(f"[WebSocket Gateway] Client {client_id} đã tham gia room 'dashboard'")
    elif client_type == "mobile_ar":
        join_room("ar_clients")
        print(f"[WebSocket Gateway] Client {client_id} đã tham gia room 'ar_clients'")
    elif client_type == "agent":
        node_id = request.args.get("node_id", "0")
        join_room("agents")
        join_room(f"node_{node_id}")
        print(f"[WebSocket Gateway] Agent {client_id} đã tham gia room 'agents' & 'node_{node_id}'")

    emit("connection_ack", {"status": "connected", "client_id": client_id, "message": "Kết nối thành công tới Cổng WebSocket AR-IMMS Gateway"})

@socketio.on("disconnect")
def handle_disconnect():
    """Xử lý sự kiện khi Client ngắt kết nối WebSocket."""
    client_id = request.sid
    print(f"[WebSocket Gateway] Client đã ngắt kết nối: {client_id}")

@socketio.on("subscribe_node")
def handle_subscribe_node(data: Dict[str, Any]):
    """Cho phép Mobile AR hoặc Web Client đăng ký nhận luồng dữ liệu của một nút máy chủ cụ thể."""
    node_id = data.get("node_id")
    if node_id:
        room_name = f"node_{node_id}"
        join_room(room_name)
        print(f"[WebSocket Gateway] Client {request.sid} đã đăng ký nhận dữ liệu room '{room_name}'")
        emit("subscribe_ack", {"status": "subscribed", "node_id": node_id, "room": room_name})

@socketio.on("agent_telemetry_stream")
def handle_agent_telemetry_stream(data: Dict[str, Any]):
    """
    Lắng nghe dữ liệu telemetry thời gian thực do Collector Agent gửi qua WebSocket.
    Lưu dữ liệu vào CSDL và tự động phát truyền ngay lập tức tới Web Dashboard & Mobile AR.
    """
    from core.container import container
    try:
        telemetry_service = container.telemetry_service()
        # Lưu trữ bản tin telemetry vào CSDL
        result = telemetry_service.record_telemetry_snapshot(data)
        
        # Trích xuất dữ liệu đầy đủ để phát truyền cho các client
        node_id = data.get("node_id")
        if node_id:
            full_telemetry = telemetry_service.get_realtime_telemetry_by_node_id(int(node_id))
            broadcast_telemetry_update(full_telemetry)

        emit("agent_ack", {"status": "success", "result": result})
    except Exception as e:
        print(f"[Lỗi WebSocket] Không thể xử lý dữ liệu agent telemetry: {e}")
        emit("agent_ack", {"status": "error", "message": str(e)})

# Các hàm phát truyền dữ liệu toàn hệ thống (Public Broadcasting Functions)
def broadcast_telemetry_update(telemetry_payload: Dict[str, Any]):
    """
    Phát truyền bản tin telemetry thời gian thực tới Web Dashboard, Mobile AR clients và phòng theo Node ID.
    """
    node_id = telemetry_payload.get("node_id")
    # Phát tới toàn bộ màn hình giám sát Web Dashboard
    socketio.emit("telemetry_update", telemetry_payload, to="dashboard")
    # Phát tới toàn bộ thiết bị Mobile AR đang quét
    socketio.emit("telemetry_update", telemetry_payload, to="ar_clients")
    # Phát tới phòng cụ thể theo Node ID
    if node_id:
        socketio.emit("telemetry_update", telemetry_payload, to=f"node_{node_id}")

def broadcast_alert_event(alert_payload: Dict[str, Any]):
    """
    Phát truyền sự kiện cảnh báo (kích hoạt / xác nhận / đóng alert) tới các Client.
    """
    socketio.emit("alert_event", alert_payload, to="dashboard")
    socketio.emit("alert_event", alert_payload, to="ar_clients")

def broadcast_node_status_change(node_status_payload: Dict[str, Any]):
    """
    Phát truyền sự thay đổi trạng thái của máy chủ (ví dụ: ONLINE -> WARNING -> CRITICAL -> UNAVAILABLE).
    """
    socketio.emit("node_status_change", node_status_payload, to="dashboard")
    socketio.emit("node_status_change", node_status_payload, to="ar_clients")
