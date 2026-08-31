"""
AR-IMMS Tầng Nghiệp vụ Domain - Định nghĩa các Lớp Ngoại lệ (Domain Exceptions)
"""

class DomainException(Exception):
    """Lớp ngoại lệ cơ sở cho các lỗi nghiệp vụ trong hệ thống."""
    def __init__(self, message: str, code: str = "DOMAIN_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code

class EntityNotFoundError(DomainException):
    """Lỗi không tìm thấy thực thể đối tượng trong CSDL."""
    def __init__(self, entity_name: str, entity_id: str):
        super().__init__(f"{entity_name} với mã ID '{entity_id}' không tồn tại trong hệ thống.", code="ENTITY_NOT_FOUND")
        self.entity_name = entity_name
        self.entity_id = entity_id

class DuplicateEntityError(DomainException):
    """Lỗi trùng lặp thực thể (đã tồn tại dữ liệu)."""
    def __init__(self, entity_name: str, field_name: str, value: str):
        super().__init__(f"{entity_name} với {field_name} '{value}' đã tồn tại.", code="DUPLICATE_ENTITY")

class UnauthorizedError(DomainException):
    """Lỗi chưa xác thực (thiếu Token hoặc thông tin đăng nhập không hợp lệ)."""
    def __init__(self, message: str = "Thông tin đăng nhập không chính xác hoặc thiếu token xác thực."):
        super().__init__(message, code="UNAUTHORIZED")

class ForbiddenError(DomainException):
    """Lỗi không có quyền truy cập (RBAC permission bị từ chối)."""
    def __init__(self, message: str = "Bạn không có quyền thực hiện thao tác này."):
        super().__init__(message, code="FORBIDDEN")

class ValidationFailedError(DomainException):
    """Lỗi dữ liệu đầu vào không hợp lệ."""
    def __init__(self, message: str):
        super().__init__(message, code="VALIDATION_FAILED")

class StaleDataError(DomainException):
    """Lỗi dữ liệu telemetry máy chủ bị ngắt kết nối quá hạn (>90s)."""
    def __init__(self, message: str = "Dữ liệu telemetry của máy chủ đã bị quá hạn (>90s)."):
        super().__init__(message, code="STALE_DATA")

class InvalidStateTransitionError(DomainException):
    """Lỗi chuyển đổi trạng thái không hợp lệ (ví dụ ticket state)."""
    def __init__(self, current_state: str, target_state: str):
        super().__init__(f"Không thể chuyển đổi từ trạng thái '{current_state}' sang '{target_state}'.", code="INVALID_STATE_TRANSITION")