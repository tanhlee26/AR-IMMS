"""
AR-IMMS Tầng Hạ tầng Repository - Truy vấn CSDL cho Phân cấp Digital Twin
"""
from typing import List, Optional
from infrastructure.models.hierarchy_model import (
    SiteModel, RoomModel, RackModel, NodeModel,
    ContainerModel, MarkerModel, DataCollectorAgentModel
)


class HierarchyRepository:

    # ── Site ──────────────────────────────────────────────────────────────────
    def get_all_sites(self) -> List[SiteModel]:
        return SiteModel.query.order_by(SiteModel.id).all()

    def get_site_by_id(self, site_id: int) -> Optional[SiteModel]:
        return SiteModel.query.get(site_id)

    # ── Room ──────────────────────────────────────────────────────────────────
    def get_rooms_by_site(self, site_id: int) -> List[RoomModel]:
        return RoomModel.query.filter_by(site_id=site_id).order_by(RoomModel.id).all()

    def get_room_by_id(self, room_id: int) -> Optional[RoomModel]:
        return RoomModel.query.get(room_id)

    # ── Rack ──────────────────────────────────────────────────────────────────
    def get_racks_by_room(self, room_id: int) -> List[RackModel]:
        return RackModel.query.filter_by(room_id=room_id).order_by(RackModel.id).all()

    def get_rack_by_id(self, rack_id: int) -> Optional[RackModel]:
        return RackModel.query.get(rack_id)

    # ── Node ──────────────────────────────────────────────────────────────────
    def get_nodes_by_rack(self, rack_id: int) -> List[NodeModel]:
        return NodeModel.query.filter_by(rack_id=rack_id).order_by(NodeModel.rack_position_u).all()

    def get_node_by_id(self, node_id: int) -> Optional[NodeModel]:
        return NodeModel.query.get(node_id)

    def get_all_nodes(self) -> List[NodeModel]:
        return NodeModel.query.order_by(NodeModel.id).all()
