"""
AR-IMMS Tầng API Controller - Bộ điều khiển Xác thực JWT & Phân quyền RBAC
Các endpoint Đăng nhập, Đăng ký, Kiểm tra Token JWT và Khởi tạo dữ liệu người dùng mẫu.
"""
from flask import Blueprint, request, g
from core.container import container
from api.responses import success_response, error_response
from api.middleware import jwt_required, role_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    [POST] /api/v1/auth/login
    Xác thực tên đăng nhập/email & mật khẩu, trả về JWT Access Token và vai trò phân quyền RBAC.
    """
    payload = request.get_json() or {}
    identifier = payload.get("username") or payload.get("email") or payload.get("identifier")
    password = payload.get("password")

    auth_service = container.auth_service()
    result = auth_service.login(identifier, password)
    return success_response(data=result, message="Đăng nhập xác thực thành công.")

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    [POST] /api/v1/auth/register
    Đăng ký tài khoản người dùng mới với vai trò phân quyền chỉ định.
    """
    payload = request.get_json() or {}
    username = payload.get("username")
    email = payload.get("email")
    password = payload.get("password")
    full_name = payload.get("full_name")
    role_name = payload.get("role", "FIELD_TECHNICIAN")

    auth_service = container.auth_service()
    result = auth_service.register_user(username, email, password, full_name, role_name)
    return success_response(data=result, message="Đăng ký tài khoản người dùng thành công.", status_code=201)

@auth_bp.route("/me", methods=["GET"])
@jwt_required
def get_current_user_profile():
    """
    [GET] /api/v1/auth/me
    Trích xuất thông tin người dùng hiện tại và danh sách quyền hạn RBAC. Yêu cầu truyền Bearer Token.
    """
    user = g.current_user
    return success_response(
        data={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role_name,
            "permissions": user.permissions
        },
        message="Trích xuất thông tin người dùng thành công."
    )

@auth_bp.route("/seed-users", methods=["POST"])
def seed_users():
    """
    [POST] /api/v1/auth/seed-users
    Khởi tạo danh sách các vai trò chuẩn (Admin, Operator, Technician) và tài khoản mẫu vào CSDL.
    """
    auth_service = container.auth_service()
    result = auth_service.seed_default_users()
    return success_response(data=result, message="Khởi tạo danh sách vai trò và tài khoản mẫu thành công.")
