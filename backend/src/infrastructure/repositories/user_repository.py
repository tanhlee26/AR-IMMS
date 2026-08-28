"""
AR-IMMS Infrastructure Layer - User & Role Repository
Handles database operations for Users, Roles (RBAC), and Notifications.
"""
import json
from datetime import datetime
from typing import Optional, List
from werkzeug.security import generate_password_hash, check_password_hash
from infrastructure.databases import db
from infrastructure.models import UserModel, RoleModel, NotificationModel

class UserRepository:
    def get_by_id(self, user_id: int) -> Optional[UserModel]:
        return UserModel.query.get(user_id)

    def get_by_username(self, username: str) -> Optional[UserModel]:
        return UserModel.query.filter_by(username=username).first()

    def get_by_email(self, email: str) -> Optional[UserModel]:
        return UserModel.query.filter_by(email=email).first()

    def get_by_username_or_email(self, identifier: str) -> Optional[UserModel]:
        return (
            UserModel.query
            .filter((UserModel.username == identifier) | (UserModel.email == identifier))
            .first()
        )

    def get_role_by_name(self, role_name: str) -> Optional[RoleModel]:
        return RoleModel.query.filter_by(name=role_name).first()

    def get_role_by_id(self, role_id: int) -> Optional[RoleModel]:
        return RoleModel.query.get(role_id)

    def create_role(self, name: str, description: str = "", permissions: List[str] = None) -> RoleModel:
        role = self.get_role_by_name(name)
        if not role:
            perms_json = json.dumps(permissions or [])
            role = RoleModel(name=name, description=description, permissions_json=perms_json)
            db.session.add(role)
            db.session.commit()
        return role

    def create_user(self, username: str, email: str, password_raw: str, full_name: str, role_id: int) -> UserModel:
        password_hash = generate_password_hash(password_raw)
        user = UserModel(
            username=username,
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role_id=role_id,
            is_active=True
        )
        db.session.add(user)
        db.session.commit()
        return user

    def seed_default_roles_and_users(self):
        """Seeds standard RBAC roles and default demo users if CSDL is empty."""
        roles_spec = [
            {
                "name": "ADMINISTRATOR",
                "description": "Quản trị viên toàn quyền hệ thống IMMS",
                "permissions": ["all", "user:manage", "site:manage", "threshold:manage", "ticket:approve"]
            },
            {
                "name": "SYSTEM_OPERATOR",
                "description": "Vận hành viên trực ca Command Center",
                "permissions": ["dashboard:view", "alert:ack", "ticket:create", "ticket:assign", "ticket:approve"]
            },
            {
                "name": "FIELD_TECHNICIAN",
                "description": "Kỹ thuật viên hiện trường thao tác AR Mobile",
                "permissions": ["ar:scan", "ticket:view_assigned", "ticket:update", "ticket:request_closure"]
            }
        ]

        roles_map = {}
        for r_data in roles_spec:
            role = self.create_role(
                name=r_data["name"],
                description=r_data["description"],
                permissions=r_data["permissions"]
            )
            roles_map[r_data["name"]] = role.id

        # Default Demo Users
        default_users = [
            {
                "username": "admin",
                "email": "admin@ar-imms.vn",
                "password": "adminpassword2026",
                "full_name": "Nguyen Van Admin",
                "role_name": "ADMINISTRATOR"
            },
            {
                "username": "operator",
                "email": "operator@ar-imms.vn",
                "password": "operatorpassword2026",
                "full_name": "Tran Van Operator",
                "role_name": "SYSTEM_OPERATOR"
            },
            {
                "username": "technician",
                "email": "tech@ar-imms.vn",
                "password": "techpassword2026",
                "full_name": "Le Van Technician",
                "role_name": "FIELD_TECHNICIAN"
            }
        ]

        created_users = []
        for u_data in default_users:
            if not self.get_by_username(u_data["username"]):
                role_id = roles_map[u_data["role_name"]]
                u = self.create_user(
                    username=u_data["username"],
                    email=u_data["email"],
                    password_raw=u_data["password"],
                    full_name=u_data["full_name"],
                    role_id=role_id
                )
                created_users.append(u)

        return created_users