"""
AR-IMMS Business Logic Layer - Authentication & RBAC Service
Handles JWT token generation, decoding, user authentication, and RBAC role validation.
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
        """Generates a signed JWT Bearer Token valid for 24 hours."""
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
        """Decodes and validates JWT Bearer Token signature and expiration."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise UnauthorizedError("JWT Token has expired. Please log in again.")
        except jwt.InvalidTokenError:
            raise UnauthorizedError("Invalid or corrupted JWT Token.")

    def login(self, identifier: str, password_raw: str) -> Dict[str, Any]:
        """Authenticates user login credentials and returns JWT Access Token."""
        if not identifier or not password_raw:
            raise ValidationFailedError("Username/Email and Password are required.")

        user = self.repository.get_by_username_or_email(identifier)
        if not user or not user.is_active:
            raise UnauthorizedError("Invalid username or password.")

        if not check_password_hash(user.password_hash, password_raw):
            raise UnauthorizedError("Invalid username or password.")

        role = self.repository.get_role_by_id(user.role_id)
        role_name = role.name if role else "GUEST"
        permissions = json.loads(role.permissions_json) if role and role.permissions_json else []

        token = self.generate_token(user.id, user.username, user.email, role_name)

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
        """Fetches user profile for middleware authorization context."""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise EntityNotFoundError("User", str(user_id))

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
        """Registers a new user account with assigned RBAC role."""
        if self.repository.get_by_username(username):
            raise DuplicateEntityError("User", "username", username)

        if self.repository.get_by_email(email):
            raise DuplicateEntityError("User", "email", email)

        role = self.repository.get_role_by_name(role_name)
        if not role:
            raise EntityNotFoundError("Role", role_name)

        user = self.repository.create_user(username, email, password_raw, full_name, role.id)
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": role.name
        }

    def seed_default_users(self) -> Dict[str, Any]:
        """Seeds default roles and users into CSDL."""
        created_users = self.repository.seed_default_roles_and_users()
        return {
            "seeded_count": len(created_users),
            "users": [u.username for u in created_users]
        }

