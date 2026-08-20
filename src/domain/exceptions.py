class DomainException(Exception):
    """Base exception class for domain errors."""
    def __init__(self, message: str, code: str = "DOMAIN_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code

class EntityNotFoundError(DomainException):
    def __init__(self, entity_name: str, entity_id: str):
        super().__init__(f"{entity_name} with ID '{entity_id}' was not found.", code="ENTITY_NOT_FOUND")
        self.entity_name = entity_name
        self.entity_id = entity_id

class DuplicateEntityError(DomainException):
    def __init__(self, entity_name: str, field_name: str, value: str):
        super().__init__(f"{entity_name} with {field_name} '{value}' already exists.", code="DUPLICATE_ENTITY")

class UnauthorizedError(DomainException):
    def __init__(self, message: str = "Invalid credentials or missing authentication token."):
        super().__init__(message, code="UNAUTHORIZED")

class ForbiddenError(DomainException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(message, code="FORBIDDEN")

class ValidationFailedError(DomainException):
    def __init__(self, message: str):
        super().__init__(message, code="VALIDATION_FAILED")

class StaleDataError(DomainException):
    def __init__(self, message: str = "Node telemetry data is stale (>90s)."):
        super().__init__(message, code="STALE_DATA")

class InvalidStateTransitionError(DomainException):
    def __init__(self, current_state: str, target_state: str):
        super().__init__(f"Cannot transition from state '{current_state}' to '{target_state}'.", code="INVALID_STATE_TRANSITION")