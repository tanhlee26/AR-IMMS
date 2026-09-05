"""
AR-IMMS Tầng Nghiệp vụ Service - Dịch vụ Xác thực JWT & Phân quyền RBAC
Phát hành và giải mã JWT Bearer Token, xác thực đăng nhập người dùng và kiểm tra vai trò RBAC.
"""
import os
import json
import jwt
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from werkzeug.security import check_password_hash
from domain.exceptions import UnauthorizedError, EntityNotFoundError, DuplicateEntityError, ValidationFailedError
from infrastructure.repositories.user_repository import UserRepository

class UserProfileDTO:
    def __init__(self, user_id: int, username: str, email: str, full_name: str, role_name: str, permissions: list):
        self.id = user_id
        self.username = username
        self.email = email
        self.full_name = full_name
        self.role_name = role_name
        self.permissions = permissions

class AuthService:
    def __init__(self):
        self.repository = UserRepository()
        self.secret_key = os.environ.get("SECRET_KEY", "ar_imms_super_secret_jwt_key_2026")
        self.algorithm = "HS256"

    def generate_token(self, user_id: int, username: str, email: str, role_name: str) -> str:
        """Tạo mã xác thực JWT Bearer Token có hiệu lực 24 giờ."""
        expiration = datetime.now(timezone.utc) + timedelta(hours=24)
        payload = {
            "sub": str(user_id),
            "username": username,
            "email": email,
            "role": role_name,
            "exp": expiration
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def decode_token(self, token: str) -> Dict[str, Any]:
        """Giải mã và xác thực chữ ký cũng như thời hạn của JWT Bearer Token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise UnauthorizedError("JWT Token đã quá hạn. Vui lòng đăng nhập lại.")
        except jwt.InvalidTokenError:
            raise UnauthorizedError("JWT Token không hợp lệ hoặc bị hỏng.")

    def login(self, identifier: str, password_raw: str) -> Dict[str, Any]:
        """Xác thực đăng nhập người dùng và phát hành JWT Access Token."""
        if not identifier or not password_raw:
            raise ValidationFailedError("Tên đăng nhập/Email và Mật khẩu là bắt buộc.")

        user = self.repository.get_by_username_or_email(identifier)
        if not user or not user.is_active:
            raise UnauthorizedError("Tên đăng nhập hoặc mật khẩu không chính xác.")

        if not check_password_hash(user.password_hash, password_raw):
            raise UnauthorizedError("Tên đăng nhập hoặc mật khẩu không chính xác.")

        role = self.repository.get_role_by_id(user.role_id)
        role_name = role.name if role else "GUEST"
        permissions = json.loads(role.permissions_json) if role and role.permissions_json else []

        token = self.generate_token(user.id, user.username, user.email, role_name)

        # Ghi nhận Nhật ký kiểm toán đăng nhập
        try:
            from core.container import container
            audit_service = container.audit_service()
            audit_service.record_log(
                action="USER_LOGIN",
                target_entity="USER",
                target_id=str(user.id),
                user_id=user.id,
                username=user.username,
                details={"role": role_name, "login_method": "PASSWORD"}
            )
        except Exception:
            pass

        return {
            "access_token": token,
            "token_type": "Bearer",
            "expires_in_seconds": 86400,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": role_name,
                "permissions": permissions
            }
        }

    def get_user_by_id(self, user_id: int) -> UserProfileDTO:
        """Trích xuất thông tin người dùng phục vụ phân quyền trong Middleware."""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise EntityNotFoundError("Người dùng", str(user_id))

        role = self.repository.get_role_by_id(user.role_id)
        role_name = role.name if role else "GUEST"
        permissions = json.loads(role.permissions_json) if role and role.permissions_json else []

        return UserProfileDTO(
            user_id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role_name=role_name,
            permissions=permissions
        )

    def register_user(self, username: str, email: str, password_raw: str, full_name: str, role_name: str = "FIELD_TECHNICIAN") -> Dict[str, Any]:
        """Đăng ký tài khoản người dùng mới và gán vai trò RBAC."""
        if self.repository.get_by_username(username):
            raise DuplicateEntityError("Người dùng", "tên đăng nhập", username)

        if self.repository.get_by_email(email):
            raise DuplicateEntityError("Người dùng", "email", email)

        role = self.repository.get_role_by_name(role_name)
        if not role:
            raise EntityNotFoundError("Vai trò", role_name)

        user = self.repository.create_user(username, email, password_raw, full_name, role.id)
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": role.name
        }

    def seed_default_users(self) -> Dict[str, Any]:
        """Khởi tạo danh sách vai trò chuẩn và tài khoản người dùng mẫu vào CSDL."""
        created_users = self.repository.seed_default_roles_and_users()
        return {
            "seeded_count": len(created_users),
            "users": [u.username for u in created_users]
        }
