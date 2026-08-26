from flask import jsonify, Response
from typing import Any, Optional

def success_response(data: Any = None, message: str = "Success", status_code: int = 200) -> Response:
    payload = {
        "status": "success",
        "message": message,
        "data": data
    }
    return jsonify(payload), status_code

def error_response(message: str, code: str = "ERROR", status_code: int = 400, errors: Optional[Any] = None) -> Response:
    payload = {
        "status": "error",
        "code": code,
        "message": message,
        "errors": errors
    }
    return jsonify(payload), status_code