"""
AR-IMMS Tầng Hạ tầng Repository - Kho lưu trữ Nhật ký Kiểm toán Bất biến (Audit Log Repository)
Cung cấp phương thức ghi nhận nhật ký chỉ thêm (Append-only) và truy vấn lịch sử thao tác.
Đảm bảo tính bất biến: Không cung cấp bất kỳ API nào để cập nhật (UPDATE) hay xóa (DELETE) nhật ký kiểm toán.
"""
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from infrastructure.databases import db
from infrastructure.models import AuditLogModel

class AuditRepository:
    def log_action(
        self,
        action: str,
        target_entity: str,
        target_id: Optional[str] = None,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLogModel:
        """
        Ghi nhận một sự kiện kiểm toán mới vào CSDL (Bất biến - Chỉ chèn mới).
        """
        details_json = json.dumps(details, ensure_ascii=False) if details else None
        log_entry = AuditLogModel(
            user_id=user_id,
            username=username,
            action=action,
            target_entity=target_entity,
            target_id=str(target_id) if target_id is not None else None,
            details_json=details_json,
            ip_address=ip_address,
            timestamp=datetime.utcnow()
        )
        db.session.add(log_entry)
        db.session.commit()
        return log_entry

    def get_logs(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        target_entity: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[AuditLogModel]:
        """
        Truy vấn danh sách nhật ký kiểm toán với các bộ lọc phân trang và thời gian.
        """
        query = AuditLogModel.query

        if user_id:
            query = query.filter_by(user_id=user_id)
        if action:
            query = query.filter(AuditLogModel.action.ilike(f"%{action}%"))
        if target_entity:
            query = query.filter_by(target_entity=target_entity)
        if start_date:
            query = query.filter(AuditLogModel.timestamp >= start_date)
        if end_date:
            query = query.filter(AuditLogModel.timestamp <= end_date)

        return query.order_by(AuditLogModel.timestamp.desc()).limit(limit).offset(offset).all()

    def count_logs(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        target_entity: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> int:
        """Đếm tổng số bản ghi nhật ký kiểm toán theo bộ lọc."""
        query = AuditLogModel.query

        if user_id:
            query = query.filter_by(user_id=user_id)
        if action:
            query = query.filter(AuditLogModel.action.ilike(f"%{action}%"))
        if target_entity:
            query = query.filter_by(target_entity=target_entity)
        if start_date:
            query = query.filter(AuditLogModel.timestamp >= start_date)
        if end_date:
            query = query.filter(AuditLogModel.timestamp <= end_date)

        return query.count()

