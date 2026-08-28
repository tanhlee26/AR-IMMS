"""
AR-IMMS API Layer - Authentication & RBAC Controller
Endpoints for User Login, Registration, JWT Token Validation, and Seed Users.
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
    Authenticates username/email & password, returning signed JWT Access Token and RBAC role.
    """
    payload = request.get_json() or {}
    identifier = payload.get("username") or payload.get("email") or payload.get("identifier")
    password = payload.get("password")

    auth_service = container.auth_service()
    result = auth_service.login(identifier, password)
    return success_response(data=result, message="Authentication successful.")

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    [POST] /api/v1/auth/register
    Registers a new user account with assigned RBAC role.
    """
    payload = request.get_json() or {}
    username = payload.get("username")
    email = payload.get("email")
    password = payload.get("password")
    full_name = payload.get("full_name")
    role_name = payload.get("role", "FIELD_TECHNICIAN")

    auth_service = container.auth_service()
    result = auth_service.register_user(username, email, password, full_name, role_name)
    return success_response(data=result, message="User registered successfully.", status_code=201)

@auth_bp.route("/me", methods=["GET"])
@jwt_required
def get_current_user_profile():
    """
    [GET] /api/v1/auth/me
    Retrieves current authenticated user profile and RBAC permissions. Requires Bearer Token.
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
        message="User profile retrieved successfully."
    )

@auth_bp.route("/seed-users", methods=["POST"])
def seed_users():
    """
    [POST] /api/v1/auth/seed-users
    Populates default RBAC roles and demo accounts (Admin, Operator, Technician).
    """
    auth_service = container.auth_service()
    result = auth_service.seed_default_users()
    return success_response(data=result, message="Default roles and users seeded successfully.")

