import { MarkerMapping } from '../types/marker';

export const MARKER_MAPPINGS: Record<string, MarkerMapping> = {
  'NODE-01': {
    nodeId: 'NODE-01',
    qrContent: 'arimms://node/NODE-01',
    arucoId: 1,
    nodeName: 'Server Alpha 01 - DB Master',
    hostname: 'srv-alpha-01',
  },
  'NODE-02': {
    nodeId: 'NODE-02',
    qrContent: 'arimms://node/NODE-02',
    arucoId: 2,
    nodeName: 'Server Beta 01 - AI Inference',
    hostname: 'srv-beta-01',
  },
  'NODE-03': {
    nodeId: 'NODE-03',
    qrContent: 'arimms://node/NODE-03',
    arucoId: 3,
    nodeName: 'Server Alpha 03 - API Gateway',
    hostname: 'srv-alpha-03',
  },
  'NODE-04': {
    nodeId: 'NODE-04',
    qrContent: 'arimms://node/NODE-04',
    arucoId: 4,
    nodeName: 'Server Delta 04 - Worker Node',
    hostname: 'srv-delta-04',
  },
};

/**
 * Phân giải nội dung mã QR hoặc ArUco Marker thành mã Node chuẩn
 * Hỗ trợ:
 * - URL scheme: "arimms://node/NODE-01" -> "NODE-01"
 * - Mã định danh: "NODE-01", "node-01" -> "NODE-01"
 * - ArUco ID: "1", 1, "aruco_1" -> "NODE-01"
 * - Chuỗi JSON: '{"node_id": "NODE-01"}' -> "NODE-01"
 */
export function resolveMarkerCode(rawCode: string): {
  normalizedNodeId: string;
  markerType: 'QR' | 'ARUCO';
  arucoId?: number;
  dbNodeId: number;
} | null {
  if (!rawCode || typeof rawCode !== 'string') return null;

  const trimmed = rawCode.trim();

  // 1. Kiểm tra URL Scheme: arimms://node/NODE-XX
  const urlMatch = trimmed.match(/^arimms:\/\/node\/(NODE-\d{2})/i);
  if (urlMatch) {
    const nodeId = urlMatch[1].toUpperCase();
    const numMatch = nodeId.match(/\d+/);
    return {
      normalizedNodeId: nodeId,
      markerType: 'QR',
      dbNodeId: numMatch ? parseInt(numMatch[0], 10) : 1,
    };
  }

  // 2. Kiểm tra JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const targetId = parsed.node_id || parsed.id || parsed.code;
      if (targetId) {
        return resolveMarkerCode(String(targetId));
      }
    } catch {
      // bỏ qua lỗi parse json
    }
  }

  // 3. Kiểm tra mã trực tiếp: NODE-01 -> NODE-04
  const nodeMatch = trimmed.toUpperCase().match(/NODE-0*([1-9]\d*)/);
  if (nodeMatch) {
    const num = parseInt(nodeMatch[1], 10);
    const formatted = `NODE-${String(num).padStart(2, '0')}`;
    return {
      normalizedNodeId: formatted,
      markerType: 'QR',
      dbNodeId: num,
    };
  }

  // 4. Kiểm tra ArUco Marker ID: "1", "2", "3", "4" hoặc "aruco_1", "aruco_id=1"
  const arucoMatch = trimmed.match(/(?:aruco[_\s-]*)?([1-9]\d*)/i);
  if (arucoMatch) {
    const id = parseInt(arucoMatch[1], 10);
    if (id >= 1 && id <= 4) {
      const formatted = `NODE-${String(id).padStart(2, '0')}`;
      return {
        normalizedNodeId: formatted,
        markerType: 'ARUCO',
        arucoId: id,
        dbNodeId: id,
      };
    }
  }

  return null;
}

/**
 * Trả về danh sách mapping để app hiển thị trong chế độ Testbed Simulator
 */
export function getAllNodeMappings(): MarkerMapping[] {
  return Object.values(MARKER_MAPPINGS);
}
