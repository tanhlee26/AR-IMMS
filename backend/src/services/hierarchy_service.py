"""
AR-IMMS Tầng Nghiệp vụ Service - Dịch vụ Phân cấp Digital Twin
Trả về cây Site → Room → Rack → Node đầy đủ hoặc từng tầng riêng lẻ.
"""
from typing import List, Dict, Any
from infrastructure.repositories.hierarchy_repositoty import HierarchyRepository
from infrastructure.models.hierarchy_model import NodeModel
from domain.exceptions import EntityNotFoundError


class HierarchyService:
    def __init__(self):
        self.repository = HierarchyRepository()

    # ── Helper serialize ──────────────────────────────────────────────────────
    @staticmethod
    def _node_to_dict(node: NodeModel) -> Dict[str, Any]:
        return {
            "id": node.id,
            "name": node.name,
            "hostname": node.hostname,
            "ip_address": node.ip_address,
            "mac_address": node.mac_address,
            "status": node.status,
            "rack_position_u": node.rack_position_u,
            "power_consumption_watts": node.power_consumption_watts,
            "last_ping_at": node.last_ping_at.strftime("%Y-%m-%dT%H:%M:%SZ") if node.last_ping_at else None,
        }

    def get_full_tree(self) -> List[Dict[str, Any]]:
        """Trả về toàn bộ cây Site → Room → Rack → Node."""
        sites = self.repository.get_all_sites()
        result = []
        for site in sites:
            rooms = self.repository.get_rooms_by_site(site.id)
            rooms_data = []
            for room in rooms:
                racks = self.repository.get_racks_by_room(room.id)
                racks_data = []
                for rack in racks:
                    nodes = self.repository.get_nodes_by_rack(rack.id)
                    racks_data.append({
                        "id": rack.id,
                        "name": rack.name,
                        "code": rack.code,
                        "unit_capacity": rack.unit_capacity,
                        "total_power_capacity_watts": rack.total_power_capacity_watts,
                        "nodes": [self._node_to_dict(n) for n in nodes],
                    })
                rooms_data.append({
                    "id": room.id,
                    "name": room.name,
                    "code": room.code,
                    "floor": room.floor,
                    "racks": racks_data,
                })
            result.append({
                "id": site.id,
                "name": site.name,
                "code": site.code,
                "location": site.location,
                "rooms": rooms_data,
            })
        return result

    def get_node_detail(self, node_id: int) -> Dict[str, Any]:
        """Trả về chi tiết node kèm vị trí trong cây phân cấp."""
        node = self.repository.get_node_by_id(node_id)
        if not node:
            raise EntityNotFoundError("Node", str(node_id))

        from infrastructure.models.hierarchy_model import RackModel, RoomModel, SiteModel
        rack = RackModel.query.get(node.rack_id)
        room = RoomModel.query.get(rack.room_id) if rack else None
        site = SiteModel.query.get(room.site_id) if room else None

        data = self._node_to_dict(node)
        data["hierarchy"] = {
            "rack_id": rack.id if rack else None,
            "rack_name": rack.name if rack else None,
            "rack_code": rack.code if rack else None,
            "room_id": room.id if room else None,
            "room_name": room.name if room else None,
            "site_id": site.id if site else None,
            "site_name": site.name if site else None,
        }
        return data
