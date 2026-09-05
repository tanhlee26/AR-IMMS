"""
AR-IMMS Tầng Nghiệp vụ Service - Dịch vụ Quản lý Vòng đời Ticket (Ticket Lifecycle Service)
Quản lý các luồng xử lý Ticket từ khi Tạo mới (OPEN), Phân công (ASSIGNED), Ghi chú tiến độ, Yêu cầu nghiệm thu (PENDING_CLOSURE) cho tới khi Đóng ticket (CLOSED).
"""
from typing import Dict, Any, List, Optional
from domain.exceptions import EntityNotFoundError, ValidationFailedError, InvalidStateTransitionError
from infrastructure.models import NodeModel, UserModel
from infrastructure.repositories.ticket_repository import TicketRepository

class TicketService:
    def __init__(self):
        self.repository = TicketRepository()

    def create_ticket(
        self, node_id: int, title: str, description: str,
        priority: str = "MEDIUM", alert_id: Optional[int] = None,
        created_by_user_id: Optional[int] = None,
        assigned_to_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Tạo mới một Phiếu công việc Bảo trì (Ticket)."""
        node = NodeModel.query.get(node_id)
        if not node:
            raise EntityNotFoundError("Máy chủ Node", str(node_id))

        if assigned_to_user_id:
            assigned_user = UserModel.query.get(assigned_to_user_id)
            if not assigned_user:
                raise EntityNotFoundError("Kỹ thuật viên", str(assigned_to_user_id))

        ticket = self.repository.create_ticket(
            node_id=node_id,
            title=title,
            description=description,
            priority=priority,
            alert_id=alert_id,
            created_by_user_id=created_by_user_id,
            assigned_to_user_id=assigned_to_user_id
        )

        # Ghi nhận Nhật ký kiểm toán tạo Ticket
        try:
            from core.container import container
            audit_service = container.audit_service()
            audit_service.record_log(
                action="TICKET_CREATE",
                target_entity="TICKET",
                target_id=str(ticket.id),
                user_id=created_by_user_id,
                details={"title": title, "priority": priority, "node_id": node_id, "alert_id": alert_id}
            )
        except Exception:
            pass

        return self.get_ticket_details(ticket.id)

    def assign_ticket(self, ticket_id: int, assigned_to_user_id: int) -> Dict[str, Any]:
        """Phân công Kỹ thuật viên xử lý Ticket (OPEN -> IN_PROGRESS)."""
        ticket = self.repository.get_ticket_by_id(ticket_id)
        if not ticket:
            raise EntityNotFoundError("Ticket", str(ticket_id))

        assigned_user = UserModel.query.get(assigned_to_user_id)
        if not assigned_user:
            raise EntityNotFoundError("Kỹ thuật viên", str(assigned_to_user_id))

        if ticket.status == "CLOSED":
            raise InvalidStateTransitionError(ticket.status, "IN_PROGRESS")

        self.repository.assign_ticket(ticket, assigned_to_user_id)

        # Ghi nhận Nhật ký kiểm toán phân công Ticket
        try:
            from core.container import container
            audit_service = container.audit_service()
            audit_service.record_log(
                action="TICKET_ASSIGN",
                target_entity="TICKET",
                target_id=str(ticket.id),
                details={"assigned_to_user_id": assigned_to_user_id, "assigned_username": assigned_user.username}
            )
        except Exception:
            pass

        return self.get_ticket_details(ticket.id)

    def add_note(self, ticket_id: int, author_user_id: int, note_text: str) -> Dict[str, Any]:
        """Thêm ghi chú tiến độ công việc vào Ticket."""
        ticket = self.repository.get_ticket_by_id(ticket_id)
        if not ticket:
            raise EntityNotFoundError("Ticket", str(ticket_id))

        if not note_text or not note_text.strip():
            raise ValidationFailedError("Nội dung ghi chú không được để rỗng.")

        note = self.repository.add_note(ticket_id, author_user_id, note_text)
        return {
            "id": note.id,
            "ticket_id": note.ticket_id,
            "author_user_id": note.author_user_id,
            "note_text": note.note_text,
            "created_at": note.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        }

    def request_closure(
        self, ticket_id: int, requested_by_user_id: int,
        summary: str, resolution_details: str
    ) -> Dict[str, Any]:
        """
        Kỹ thuật viên gửi Yêu cầu Nghiệm thu / Đóng Ticket (Step-up Verification - BR-04).
        Chuyển trạng thái Ticket từ IN_PROGRESS sang PENDING_CLOSURE.
        """
        ticket = self.repository.get_ticket_by_id(ticket_id)
        if not ticket:
            raise EntityNotFoundError("Ticket", str(ticket_id))

        if ticket.status in ["CLOSED", "PENDING_CLOSURE"]:
            raise InvalidStateTransitionError(ticket.status, "PENDING_CLOSURE")

        if not summary or not resolution_details:
            raise ValidationFailedError("Tóm tắt kết quả và chi tiết khắc phục là bắt buộc.")

        self.repository.create_closure_request(ticket, requested_by_user_id, summary, resolution_details)

        # Ghi nhận Nhật ký kiểm toán yêu cầu đóng Ticket
        try:
            from core.container import container
            audit_service = container.audit_service()
            audit_service.record_log(
                action="TICKET_REQUEST_CLOSURE",
                target_entity="TICKET",
                target_id=str(ticket.id),
                user_id=requested_by_user_id,
                details={"summary": summary}
            )
        except Exception:
            pass

        return self.get_ticket_details(ticket.id)

    def approve_closure(self, ticket_id: int, reviewed_by_user_id: int) -> Dict[str, Any]:
        """
        Vận hành viên (Operator) Phê duyệt đóng Ticket (PENDING_CLOSURE -> CLOSED).
        Tự động ghi nhận Lịch sử Bảo trì và đóng Alert liên quan.
        """
        ticket = self.repository.get_ticket_by_id(ticket_id)
        if not ticket:
            raise EntityNotFoundError("Ticket", str(ticket_id))

        if ticket.status != "PENDING_CLOSURE":
            raise InvalidStateTransitionError(ticket.status, "CLOSED")

        self.repository.approve_closure_request(ticket, reviewed_by_user_id)

        # Ghi nhận Nhật ký kiểm toán phê duyệt đóng Ticket
        try:
            from core.container import container
            audit_service = container.audit_service()
            audit_service.record_log(
                action="TICKET_APPROVE_CLOSURE",
                target_entity="TICKET",
                target_id=str(ticket.id),
                user_id=reviewed_by_user_id,
                details={"final_status": "CLOSED", "alert_id": ticket.alert_id}
            )
        except Exception:
            pass

        return self.get_ticket_details(ticket.id)

    def reject_closure(self, ticket_id: int, reviewed_by_user_id: int, rejection_reason: str) -> Dict[str, Any]:
        """Vận hành viên Từ chối yêu cầu đóng Ticket (PENDING_CLOSURE -> IN_PROGRESS)."""
        ticket = self.repository.get_ticket_by_id(ticket_id)
        if not ticket:
            raise EntityNotFoundError("Ticket", str(ticket_id))

        if ticket.status != "PENDING_CLOSURE":
            raise InvalidStateTransitionError(ticket.status, "IN_PROGRESS")

        if not rejection_reason or not rejection_reason.strip():
            raise ValidationFailedError("Lý do từ chối đóng Ticket là bắt buộc.")

        self.repository.reject_closure_request(ticket, reviewed_by_user_id, rejection_reason)

        # Ghi nhận Nhật ký kiểm toán từ chối đóng Ticket
        try:
            from core.container import container
            audit_service = container.audit_service()
            audit_service.record_log(
                action="TICKET_REJECT_CLOSURE",
                target_entity="TICKET",
                target_id=str(ticket.id),
                user_id=reviewed_by_user_id,
                details={"rejection_reason": rejection_reason}
            )
        except Exception:
            pass

        return self.get_ticket_details(ticket.id)

    def get_tickets(
        self, node_id: Optional[int] = None,
        assigned_to_user_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lấy danh sách các ticket theo các bộ lọc."""
        tickets = self.repository.get_tickets(node_id, assigned_to_user_id, status)
        return [self._format_ticket_dto(t) for t in tickets]

    def get_ticket_details(self, ticket_id: int) -> Dict[str, Any]:
        """Trích xuất chi tiết phiếu công việc Ticket đầy đủ thông tin."""
        ticket = self.repository.get_ticket_by_id(ticket_id)
        if not ticket:
            raise EntityNotFoundError("Ticket", str(ticket_id))
        return self._format_ticket_dto(ticket)

    def _format_ticket_dto(self, ticket) -> Dict[str, Any]:
        """Hàm định dạng DTO cho Ticket."""
        node = NodeModel.query.get(ticket.node_id) if ticket.node_id else None
        assigned_user = UserModel.query.get(ticket.assigned_to_user_id) if ticket.assigned_to_user_id else None
        created_user = UserModel.query.get(ticket.created_by_user_id) if ticket.created_by_user_id else None

        notes_list = [
            {
                "id": n.id,
                "author_user_id": n.author_user_id,
                "note_text": n.note_text,
                "created_at": n.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if n.created_at else None
            }
            for n in ticket.notes
        ]

        closure_req_data = None
        if ticket.closure_request:
            req_user = UserModel.query.get(ticket.closure_request.requested_by_user_id) if ticket.closure_request.requested_by_user_id else None
            closure_req_data = {
                "id": ticket.closure_request.id,
                "summary": ticket.closure_request.summary,
                "resolution_details": ticket.closure_request.resolution_details,
                "status": ticket.closure_request.status,
                "requested_by": req_user.full_name if req_user else "N/A",
                "reviewed_at": ticket.closure_request.reviewed_at.strftime("%Y-%m-%dT%H:%M:%SZ") if ticket.closure_request.reviewed_at else None
            }

        return {
            "id": ticket.id,
            "node_id": ticket.node_id,
            "node_name": node.name if node else "N/A",
            "alert_id": ticket.alert_id,
            "title": ticket.title,
            "description": ticket.description,
            "priority": ticket.priority,
            "status": ticket.status,
            "created_by": created_user.full_name if created_user else "Hệ thống",
            "assigned_to": assigned_user.full_name if assigned_user else "Chưa phân công",
            "assigned_to_user_id": ticket.assigned_to_user_id,
            "created_at": ticket.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if ticket.created_at else None,
            "updated_at": ticket.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ") if ticket.updated_at else None,
            "notes": notes_list,
            "closure_request": closure_req_data
        }

