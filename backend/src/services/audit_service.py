"""
AR-IMMS Tầng Nghiệp vụ Service - Dịch vụ Nhật ký Kiểm toán Bất biến (Audit Log Service)
Cung cấp nghiệp vụ ghi nhận hành động tác động hệ thống và truy vết lịch sử vận hành.
"""
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from domain.exceptions import ValidationFailedError
from infrastructure.repositories.audit_repository import AuditRepository

class AuditService:
    def __init__(self):
        self.repository = AuditRepository()

    def record_log(
        self,
        action: str,
        target_entity: str,
        target_id: Optional[str] = None,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Ghi nhận một sự kiện kiểm toán mới vào hệ thống.
        """
        if not action or not target_entity:
            raise ValidationFailedError("Hành động 'action' và thực thể 'target_entity' là bắt buộc.")

        log_entry = self.repository.log_action(
            action=action,
            target_entity=target_entity,
            target_id=target_id,
            user_id=user_id,
            username=username,
            details=details,
            ip_address=ip_address
        )
        return self._format_log_dto(log_entry)

    def get_logs(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        target_entity: Optional[str] = None,
        start_date_str: Optional[str] = None,
        end_date_str: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """
        Truy vấn danh sách nhật ký kiểm toán có phân trang.
        """
        start_date = None
        end_date = None

        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
            except ValueError:
                raise ValidationFailedError("Định dạng start_date không hợp lệ (cần chuẩn ISO 8601).")

        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
            except ValueError:
                raise ValidationFailedError("Định dạng end_date không hợp lệ (cần chuẩn ISO 8601).")

        offset = max(0, (page - 1) * page_size)
        logs = self.repository.get_logs(
            user_id=user_id,
            action=action,
            target_entity=target_entity,
            start_date=start_date,
            end_date=end_date,
            limit=page_size,
            offset=offset
        )
        total_count = self.repository.count_logs(
            user_id=user_id,
            action=action,
            target_entity=target_entity,
            start_date=start_date,
            end_date=end_date
        )

        return {
            "total_records": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 1,
            "logs": [self._format_log_dto(log) for log in logs]
        }

    def _format_log_dto(self, log) -> Dict[str, Any]:
        """Hàm định dạng DTO cho bản ghi nhật ký kiểm toán."""
        parsed_details = None
        if log.details_json:
            try:
                parsed_details = json.loads(log.details_json)
            except Exception:
                parsed_details = log.details_json

        return {
            "id": log.id,
            "user_id": log.user_id,
            "username": log.username or "SYSTEM",
            "action": log.action,
            "target_entity": log.target_entity,
            "target_id": log.target_id,
            "details": parsed_details,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ") if log.timestamp else None
        }

