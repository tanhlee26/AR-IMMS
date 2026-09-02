"""
AR-IMMS Tầng Hạ tầng Repository - Kho lưu trữ Phiếu Bảo trì (Ticket Repository)
Thực hiện các thao tác CSDL cho Ticket, Ticket Notes, Closure Requests và Lịch sử Bảo trì Maintenance History.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from infrastructure.databases import db
from infrastructure.models import (
    TicketModel, TicketNoteModel, TicketClosureRequestModel,
    MaintenanceHistoryModel, AlertModel, NodeModel
)

class TicketRepository:
    def get_ticket_by_id(self, ticket_id: int) -> Optional[TicketModel]:
        """Tra cứu ticket theo ID."""
        return TicketModel.query.get(ticket_id)

    def get_tickets(
        self,
        node_id: Optional[int] = None,
        assigned_to_user_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[TicketModel]:
        """Truy vấn danh sách ticket với các bộ lọc node, người xử lý và trạng thái."""
        query = TicketModel.query
        if node_id:
            query = query.filter_by(node_id=node_id)
        if assigned_to_user_id:
            query = query.filter_by(assigned_to_user_id=assigned_to_user_id)
        if status:
            query = query.filter_by(status=status)

        return query.order_by(TicketModel.created_at.desc()).all()

    def create_ticket(
        self, node_id: int, title: str, description: str,
        priority: str = "MEDIUM", alert_id: Optional[int] = None,
        created_by_user_id: Optional[int] = None,
        assigned_to_user_id: Optional[int] = None
    ) -> TicketModel:
        """Tạo mới một Phiếu công việc Bảo trì (Ticket)."""
        status = "IN_PROGRESS" if assigned_to_user_id else "OPEN"
        ticket = TicketModel(
            node_id=node_id,
            alert_id=alert_id,
            title=title,
            description=description,
            priority=priority,
            status=status,
            created_by_user_id=created_by_user_id,
            assigned_to_user_id=assigned_to_user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(ticket)
        db.session.commit()
        return ticket

    def assign_ticket(self, ticket: TicketModel, assigned_to_user_id: int):
        """Phân công Kỹ thuật viên xử lý Ticket và chuyển trạng thái sang IN_PROGRESS."""
        ticket.assigned_to_user_id = assigned_to_user_id
        ticket.status = "IN_PROGRESS"
        ticket.updated_at = datetime.utcnow()
        db.session.commit()

    def add_note(self, ticket_id: int, author_user_id: int, note_text: str) -> TicketNoteModel:
        """Thêm ghi chú tiến độ công việc vào Ticket."""
        note = TicketNoteModel(
            ticket_id=ticket_id,
            author_user_id=author_user_id,
            note_text=note_text,
            created_at=datetime.utcnow()
        )
        db.session.add(note)
        
        # Cập nhật mốc thời gian ticket
        ticket = self.get_ticket_by_id(ticket_id)
        if ticket:
            ticket.updated_at = datetime.utcnow()

        db.session.commit()
        return note

    def create_closure_request(
        self, ticket: TicketModel, requested_by_user_id: int,
        summary: str, resolution_details: str
    ) -> TicketClosureRequestModel:
        """
        Tạo Yêu cầu Nghiệm thu / Đóng Ticket (Step-up Closure Request - BR-04).
        Chuyển trạng thái Ticket sang PENDING_CLOSURE.
        """
        # Xóa yêu cầu cũ nếu có
        if ticket.closure_request:
            db.session.delete(ticket.closure_request)

        closure_req = TicketClosureRequestModel(
            ticket_id=ticket.id,
            requested_by_user_id=requested_by_user_id,
            summary=summary,
            resolution_details=resolution_details,
            status="PENDING",
            created_at=datetime.utcnow()
        )
        db.session.add(closure_req)
        
        ticket.status = "PENDING_CLOSURE"
        ticket.updated_at = datetime.utcnow()
        
        db.session.commit()
        return closure_req

    def approve_closure_request(self, ticket: TicketModel, reviewed_by_user_id: int):
        """
        Phê duyệt đóng Ticket (Operator Approve).
        Chuyển trạng thái Ticket sang CLOSED, tự động tạo bản ghi Lịch sử Bảo trì (Maintenance History).
        """
        if ticket.closure_request:
            ticket.closure_request.status = "APPROVED"
            ticket.closure_request.reviewed_by_user_id = reviewed_by_user_id
            ticket.closure_request.reviewed_at = datetime.utcnow()

        ticket.status = "CLOSED"
        ticket.updated_at = datetime.utcnow()

        # Tạo lịch sử bảo trì thiết bị
        history = MaintenanceHistoryModel(
            node_id=ticket.node_id,
            ticket_id=ticket.id,
            maintenance_type="CORRECTIVE" if ticket.alert_id else "PREVENTIVE",
            description=ticket.title,
            performed_by_user_id=ticket.assigned_to_user_id or reviewed_by_user_id,
            performed_at=datetime.utcnow(),
            resolution_notes=ticket.closure_request.resolution_details if ticket.closure_request else ticket.description
        )
        db.session.add(history)

        # Nếu ticket gắn với Alert -> Đóng Alert
        if ticket.alert_id:
            alert = AlertModel.query.get(ticket.alert_id)
            if alert and alert.status in ["OPEN", "ACKNOWLEDGED"]:
                alert.status = "RESOLVED"
                alert.resolved_at = datetime.utcnow()
                alert.resolved_by_user_id = reviewed_by_user_id

        db.session.commit()

    def reject_closure_request(self, ticket: TicketModel, reviewed_by_user_id: int, rejection_reason: str):
        """Từ chối đóng Ticket, trả Ticket về lại trạng thái IN_PROGRESS để Kỹ thuật viên xử lý tiếp."""
        if ticket.closure_request:
            ticket.closure_request.status = "REJECTED"
            ticket.closure_request.reviewed_by_user_id = reviewed_by_user_id
            ticket.closure_request.reviewed_at = datetime.utcnow()

        ticket.status = "IN_PROGRESS"
        ticket.updated_at = datetime.utcnow()

        # Thêm ghi chú lý do từ chối
        note = TicketNoteModel(
            ticket_id=ticket.id,
            author_user_id=reviewed_by_user_id,
            note_text=f"[YÊU CẦU ĐÓNG TICKET BỊ TỪ CHỐI]: {rejection_reason}",
            created_at=datetime.utcnow()
        )
        db.session.add(note)
        db.session.commit()

