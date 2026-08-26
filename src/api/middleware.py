from functools import wraps
from flask import request, g
from domain.exceptions import DomainException, UnauthorizedError, ForbiddenError
from api.responses import error_response

def get_token_from_header() -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise UnauthorizedError("Missing Authorization header.")
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedError("Invalid Authorization header format. Expected 'Bearer <token>'.")
    return parts[1]

def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from dependency_container import container
        auth_service = container.auth_service()
        token = get_token_from_header()
        payload = auth_service.decode_token(token)
        user_id = int(payload["sub"])
        user = auth_service.get_user_by_id(user_id)
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, "current_user") or not g.current_user:
                raise UnauthorizedError("Authentication required.")
            user_role = g.current_user.role_name
            role_values = [r.value if hasattr(r, "value") else str(r) for r in roles]
            if user_role not in role_values and "ADMINISTRATOR" not in role_values:
                raise ForbiddenError(f"Action requires one of the following roles: {role_values}")
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def register_middleware(app):
    @app.errorhandler(DomainException)
    def handle_domain_exception(e):
        status = 400
        if e.code == "UNAUTHORIZED":
            status = 401
        elif e.code == "FORBIDDEN":
            status = 403
        elif e.code == "ENTITY_NOT_FOUND":
            status = 404
        elif e.code == "DUPLICATE_ENTITY":
            status = 409
        return error_response(message=e.message, code=e.code, status_code=status)

    @app.errorhandler(Exception)
    def handle_generic_exception(e):
        print(f"[Unhandled Exception]: {e}")
        return error_response(message=str(e), code="INTERNAL_SERVER_ERROR", status_code=500)