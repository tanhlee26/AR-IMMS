export interface TelemetryMetric {
  value: number;
  unit: string;
  timestamp?: string;
}

export interface MetricThreshold {
  metric_type: string;
  warning: number;
  critical: number;
}

export interface NodeAlert {
  id: number;
  alert_type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  message: string;
  metric_value: number;
  triggered_at?: string;
}

export interface ContainerInfo {
  id: number;
  container_id: string;
  name: string;
  image: string;
  status: string;
  cpu_usage_percent?: number;
  memory_usage_mb?: number;
}

export interface NodeHierarchy {
  site_name: string;
  room_name: string;
  rack_name: string;
  rack_position_u?: number;
}

export interface RealtimeTelemetry {
  node_id: number;
  name: string;
  hostname: string;
  ip_address: string;
  mac_address?: string;
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'UNAVAILABLE';
  rack_position_u?: number;
  power_consumption_watts?: number;
  hierarchy: NodeHierarchy;
  metrics: {
    cpu_usage_percent?: number | TelemetryMetric;
    memory_usage_percent?: number | TelemetryMetric;
    memory_used_gb?: number | TelemetryMetric;
    temperature_celsius?: number | TelemetryMetric;
    disk_usage_percent?: number | TelemetryMetric;
    network_rx_kbps?: number | TelemetryMetric;
    network_tx_kbps?: number | TelemetryMetric;
    [key: string]: number | TelemetryMetric | undefined;
  };
  active_alerts_count: number;
  active_alerts: NodeAlert[];
  containers_count: number;
  containers: ContainerInfo[];
  ar_marker?: {
    marker_id: number;
    marker_code: string;
    marker_type: string;
    spatial_coordinates_json?: string;
  };
}

export interface RemediationResult {
  node_id: number;
  status: string;
  action_type: string;
  step_up_verified: boolean;
  summary: string;
  telemetry?: RealtimeTelemetry;
}
