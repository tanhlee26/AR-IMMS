"""
AR-IMMS Tầng API Controller - Bộ điều khiển Phân cấp Digital Twin
Trả về cây Site → Room → Rack → Node và chi tiết từng node.
"""
from flask import Blueprint
from core.container import container
from api.responses import success_response
from api.middleware import jwt_required

hierarchy_bp = Blueprint("hierarchy", __name__, url_prefix="/api/v1")


@hierarchy_bp.route("/hierarchy", methods=["GET"])
@jwt_required
def get_hierarchy_tree():
    """
    [GET] /api/v1/hierarchy
    Trả về toàn bộ cây phân cấp Site → Room → Rack → Node.
    """
    service = container.hierarchy_service()
    data = service.get_full_tree()
    return success_response(data=data, message="Trích xuất cây phân cấp Digital Twin thành công.")


@hierarchy_bp.route("/hierarchy/nodes/<int:node_id>", methods=["GET"])
@jwt_required
def get_node_detail(node_id: int):
    """
    [GET] /api/v1/hierarchy/nodes/<node_id>
    Trả về chi tiết node kèm vị trí trong cây phân cấp.
    """
    service = container.hierarchy_service()
    data = service.get_node_detail(node_id)
    return success_response(data=data, message=f"Trích xuất chi tiết node ID {node_id} thành công.")
