export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width?: number;
  height?: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface DetectedMarker {
  rawCode: string;
  normalizedNodeId: string; // e.g. "NODE-01"
  markerType: 'QR' | 'ARUCO';
  arucoId?: number;
  boundingBox: BoundingBox;
  cornerPoints?: ScreenPoint[];
  lastSeenTimestamp: number;
  confidence?: number;
}

export interface MarkerMapping {
  nodeId: string;
  qrContent: string;
  arucoId: number;
  nodeName: string;
  hostname: string;
}
