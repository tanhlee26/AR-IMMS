export type UserRole = "ADMINISTRATOR" | "SYSTEM_OPERATOR" | "FIELD_TECHNICIAN";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  permissions?: string[];
}

export interface ContainerWorkload {
  id: number;
  container_id: string;
  name: string;
  image: string;
  status: string;
  cpu_usage_percent: number;
  memory_usage_mb: number;
}

export interface ArMarker {
  id: number;
  marker_type: string;
  marker_code: string;
  spatial_coordinates?: string | null;
}

export interface ServerNode {
  id: number;
  type: "server";
  rack_id: number;
  name: string;
  hostname: string;
  ip_address: string;
  mac_address?: string | null;
  status: "ONLINE" | "WARNING" | "CRITICAL" | "UNAVAILABLE";
  ui_status: "healthy" | "warning" | "critical" | "offline";
  rack_position_u: number;
  power_consumption_watts: number;
  last_ping_at?: string | null;
  telemetry: {
    cpu: number;
    ram: number;
    temp: number;
    disk: number;
    power: number;
  };
  containers: ContainerWorkload[];
  markers: ArMarker[];
}

export interface RackUnit {
  id: number;
  type: "rack";
  room_id: number;
  name: string;
  code: string;
  unit_capacity: number;
  total_power_capacity_watts: number;
  nodes: ServerNode[];
}

export interface RoomUnit {
  id: number;
  type: "room";
  site_id: number;
  name: string;
  code: string;
  floor: string;
  racks: RackUnit[];
}

export interface SiteUnit {
  id: number;
  type: "site";
  name: string;
  code: string;
  location: string;
  description?: string | null;
  rooms: RoomUnit[];
}

export interface AlertItem {
  id: number;
  node_id: number;
  threshold_id?: number | null;
  alert_type: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  message: string;
  metric_value?: number | null;
  triggered_at?: string | null;
  acknowledged_at?: string | null;
  acknowledged_by_user_id?: number | null;
  node_name?: string;
}

export interface TicketClosureRequest {
  id?: number;
  ticket_id: number;
  requested_by_user_id: number;
  summary: string;
  resolution_details: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewed_by_user_id?: number | null;
  reviewed_at?: string | null;
  created_at?: string | null;
}

export interface TicketNote {
  id: number;
  ticket_id: number;
  author_user_id: number;
  author_name?: string;
  note_text: string;
  created_at: string;
}

export interface TicketItem {
  id: number;
  alert_id?: number | null;
  node_id: number;
  node_name?: string;
  title: string;
  description: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "IN_PROGRESS" | "PENDING_CLOSURE" | "CLOSED";
  assigned_to_user_id?: number | null;
  assigned_to_name?: string | null;
  created_by_user_id?: number | null;
  created_at: string;
  updated_at?: string;
  notes?: TicketNote[];
  closure_request?: TicketClosureRequest | null;
}

export interface PueReportData {
  pue: number;
  status: string;
  it_power_kw: number;
  facility_power_kw: number;
  total_power_kw: number;
  breakdown: {
    it_equipment_percent: number;
    cooling_system_percent: number;
    power_distribution_loss_percent: number;
    lighting_auxiliary_percent: number;
  };
  racks_breakdown?: Array<{
    rack_id: number;
    rack_name: string;
    total_power_watts: number;
    node_count: number;
  }>;
}

export interface HistoricalTelemetryPoint {
  id?: number;
  metric_type: string;
  value: number;
  unit: string;
  timestamp: string;
}
