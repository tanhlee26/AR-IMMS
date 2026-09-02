"""
AR-IMMS Tầng API Controller - Bộ điều khiển Quản lý Vòng đời Ticket (Ticket Controller)
Các endpoint trích xuất, tạo mới, phân công, ghi chú, gửi yêu cầu đóng ticket và phê duyệt đóng ticket.
"""
from flask import Blueprint, request, g
from core.container import container
from api.responses import success_response, error_response
from api.middleware import jwt_required, role_required

ticket_bp = Blueprint("ticket", __name__, url_prefix="/api/v1")

@ticket_bp.route("/tickets", methods=["GET"])
@jwt_required
def get_tickets():
    """
    [GET] /api/v1/tickets?node_id=1&status=OPEN&assigned_to_me=true
    Trích xuất danh sách các phiếu công việc ticket theo bộ lọc.
    """
    node_id_arg = request.args.get("node_id")
    status = request.args.get("status")
    assigned_to_me = request.args.get("assigned_to_me", "false").lower() in ["true", "1"]

    node_id = int(node_id_arg) if node_id_arg else None
    assigned_to_user_id = g.current_user.id if assigned_to_me else None

    ticket_service = container.ticket_service()
    tickets = ticket_service.get_tickets(node_id=node_id, assigned_to_user_id=assigned_to_user_id, status=status)
    return success_response(data=tickets, message="Trích xuất danh sách ticket thành công.")

@ticket_bp.route("/tickets/<int:ticket_id>", methods=["GET"])
@jwt_required
def get_ticket_details(ticket_id: int):
    """
    [GET] /api/v1/tickets/<ticket_id>
    Trích xuất chi tiết nội dung, tiến độ ghi chú và yêu cầu đóng ticket.
    """
    ticket_service = container.ticket_service()
    data = ticket_service.get_ticket_details(ticket_id)
    return success_response(data=data, message=f"Trích xuất chi tiết ticket ID {ticket_id} thành công.")

@ticket_bp.route("/tickets", methods=["POST"])
@jwt_required
def create_ticket():
    """
    [POST] /api/v1/tickets
    Tạo mới một phiếu công việc ticket bảo trì sự cố.
    """
    payload = request.get_json() or {}
    node_id = payload.get("node_id")
    title = payload.get("title")
    description = payload.get("description")
    priority = payload.get("priority", "MEDIUM")
    alert_id = payload.get("alert_id")
    assigned_to_user_id = payload.get("assigned_to_user_id")

    if not node_id or not title or not description:
        return error_response(message="Thiếu thông tin bắt buộc: 'node_id', 'title', 'description'.", code="BAD_REQUEST", status_code=400)

    ticket_service = container.ticket_service()
    result = ticket_service.create_ticket(
        node_id=node_id,
        title=title,
        description=description,
        priority=priority,
        alert_id=alert_id,
        created_by_user_id=g.current_user.id,
        assigned_to_user_id=assigned_to_user_id
    )

    return success_response(data=result, message="Tạo mới ticket thành công.", status_code=201)

@ticket_bp.route("/tickets/<int:ticket_id>/assign", methods=["POST"])
@jwt_required
@role_required("ADMINISTRATOR", "SYSTEM_OPERATOR")
def assign_ticket(ticket_id: int):
    """
    [POST] /api/v1/tickets/<ticket_id>/assign
    Vận hành viên phân công Kỹ thuật viên xử lý ticket (chuyển trạng thái sang IN_PROGRESS).
    """
    payload = request.get_json() or {}
    assigned_to_user_id = payload.get("assigned_to_user_id")

    if not assigned_to_user_id:
        return error_response(message="Thiếu ID kỹ thuật viên cần phân công 'assigned_to_user_id'.", code="BAD_REQUEST", status_code=400)

    ticket_service = container.ticket_service()
    result = ticket_service.assign_ticket(ticket_id, int(assigned_to_user_id))
    return success_response(data=result, message=f"Phân công ticket ID {ticket_id} thành công.")

@ticket_bp.route("/tickets/<int:ticket_id>/notes", methods=["POST"])
@jwt_required
def add_ticket_note(ticket_id: int):
    """
    [POST] /api/v1/tickets/<ticket_id>/notes
    Kỹ thuật viên hoặc Vận hành viên gửi ghi chú cập nhật tiến độ công việc.
    """
    payload = request.get_json() or {}
    note_text = payload.get("note_text")

    if not note_text or not note_text.strip():
        return error_response(message="Nội dung ghi chú 'note_text' không được để rỗng.", code="BAD_REQUEST", status_code=400)

    ticket_service = container.ticket_service()
    result = ticket_service.add_note(ticket_id, g.current_user.id, note_text)
    return success_response(data=result, message="Thêm ghi chú tiến độ thành công.", status_code=201)

@ticket_bp.route("/tickets/<int:ticket_id>/request-closure", methods=["POST"])
@jwt_required
def request_ticket_closure(ticket_id: int):
    """
    [POST] /api/v1/tickets/<ticket_id>/request-closure
    Kỹ thuật viên hiện trường gửi Yêu cầu Nghiệm thu / Đóng Ticket (Step-up Verification - BR-04).
    Chuyển trạng thái sang PENDING_CLOSURE.
    """
    payload = request.get_json() or {}
    summary = payload.get("summary")
    resolution_details = payload.get("resolution_details")

    if not summary or not resolution_details:
        return error_response(message="Cần cung cấp đầy đủ 'summary' và 'resolution_details'.", code="BAD_REQUEST", status_code=400)

    ticket_service = container.ticket_service()
    result = ticket_service.request_closure(ticket_id, g.current_user.id, summary, resolution_details)
    return success_response(data=result, message="Gửi yêu cầu nghiệm thu đóng ticket thành công.")

@ticket_bp.route("/tickets/<int:ticket_id>/approve-closure", methods=["POST"])
@jwt_required
@role_required("ADMINISTRATOR", "SYSTEM_OPERATOR")
def approve_ticket_closure(ticket_id: int):
    """
    [POST] /api/v1/tickets/<ticket_id>/approve-closure
    Vận hành viên Phê duyệt nghiệm thu đóng Ticket (chuyển trạng thái sang CLOSED và tự động lưu Lịch sử Bảo trì).
    """
    ticket_service = container.ticket_service()
    result = ticket_service.approve_closure(ticket_id, g.current_user.id)
    return success_response(data=result, message=f"Phê duyệt đóng ticket ID {ticket_id} thành công.")

@ticket_bp.route("/tickets/<int:ticket_id>/reject-closure", methods=["POST"])
@jwt_required
@role_required("ADMINISTRATOR", "SYSTEM_OPERATOR")
def reject_ticket_closure(ticket_id: int):
    """
    [POST] /api/v1/tickets/<ticket_id>/reject-closure
    Vận hành viên Từ chối yêu cầu đóng Ticket (trả ticket về trạng thái IN_PROGRESS để xử lý tiếp).
    """
    payload = request.get_json() or {}
    rejection_reason = payload.get("rejection_reason")

    if not rejection_reason or not rejection_reason.strip():
        return error_response(message="Cần cung cấp lý do từ chối 'rejection_reason'.", code="BAD_REQUEST", status_code=400)

    ticket_service = container.ticket_service()
    result = ticket_service.reject_closure(ticket_id, g.current_user.id, rejection_reason)
    return success_response(data=result, message=f"Từ chối đóng ticket ID {ticket_id} thành công.")

