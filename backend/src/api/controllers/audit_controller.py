"""
AR-IMMS Tầng API Controller - Bộ điều khiển Nhật ký Kiểm toán Bất biến (Audit Log Controller)
Cung cấp các endpoint tra cứu lịch sử tác động hệ thống bất biến (Immutable Audit Trail).
"""
from flask import Blueprint, request, g
from core.container import container
from api.responses import success_response, error_response
from api.middleware import jwt_required, role_required

audit_bp = Blueprint("audit", __name__, url_prefix="/api/v1/audit-logs")

@audit_bp.route("", methods=["GET"])
@jwt_required
def get_audit_logs():
    """
    [GET] /api/v1/audit-logs?user_id=1&action=LOGIN&target_entity=TICKET&page=1&page_size=50
    Truy vấn danh sách nhật ký kiểm toán với các bộ lọc phân trang và điều kiện tìm kiếm.
    """
    user_id_arg = request.args.get("user_id")
    user_id = int(user_id_arg) if user_id_arg else None
    action = request.args.get("action")
    target_entity = request.args.get("target_entity")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 50))

    audit_service = container.audit_service()
    data = audit_service.get_logs(
        user_id=user_id,
        action=action,
        target_entity=target_entity,
        start_date_str=start_date,
        end_date_str=end_date,
        page=page,
        page_size=page_size
    )
    return success_response(data=data, message="Trích xuất nhật ký kiểm toán thành công.")

@audit_bp.route("", methods=["POST"])
@jwt_required
def create_audit_log():
    """
    [POST] /api/v1/audit-logs
    Ghi nhận một hành động kiểm toán thủ công vào nhật ký bất biến.
    """
    payload = request.get_json() or {}
    action = payload.get("action")
    target_entity = payload.get("target_entity")
    target_id = payload.get("target_id")
    details = payload.get("details")

    if not action or not target_entity:
        return error_response(
            message="Thiếu thông tin bắt buộc: 'action', 'target_entity'.",
            code="BAD_REQUEST",
            status_code=400
        )

    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    user = getattr(g, "current_user", None)
    user_id = user.id if user else None
    username = user.username if user else "ANONYMOUS"

    audit_service = container.audit_service()
    result = audit_service.record_log(
        action=action,
        target_entity=target_entity,
        target_id=target_id,
        user_id=user_id,
        username=username,
        details=details,
        ip_address=client_ip
    )
    return success_response(data=result, message="Ghi nhận nhật ký kiểm toán thành công.", status_code=201)

