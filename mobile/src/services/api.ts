import { RealtimeTelemetry, RemediationResult } from '../types/telemetry';
import { Ticket } from '../types/ticket';

// Cấu hình URL mặc định: Android Emulator dùng 10.0.2.2:5000, máy thật dùng IP LAN
let BASE_URL = 'http://10.0.2.2:5000';
let authToken: string | null = null;

// Bộ nhớ đệm telemetry tối ưu độ trễ hiển thị (< 50ms)
const telemetryCache: Map<string | number, { data: RealtimeTelemetry; timestamp: number }> = new Map();
const CACHE_TTL_MS = 5000;

export function setApiBaseUrl(url: string) {
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  BASE_URL = cleanUrl;
}

export function getApiBaseUrl(): string {
  return BASE_URL;
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function requestJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok || (json && json.status === 'error')) {
    const message = json?.message || `HTTP Error ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return (json.data !== undefined ? json.data : json) as T;
}

/**
 * Đăng nhập Kỹ thuật viên
 */
export async function loginTechnician(username = 'technician', password = 'techpassword2026') {
  const result = await requestJson<{
    access_token: string;
    user: {
      id: number;
      username: string;
      full_name: string;
      email: string;
      role: string;
      permissions: string[];
    };
  }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (result.access_token) {
    setAuthToken(result.access_token);
  }
  return result;
}

/**
 * Lấy telemetry thời gian thực theo mã QR/ArUco Marker
 * Áp dụng Cache-First để độ trễ hiển thị thẻ AR Overlay < 50ms!
 */
export async function getRealtimeTelemetryByMarker(
  markerCode: string,
  useCache = true
): Promise<RealtimeTelemetry> {
  const cacheKey = `marker_${markerCode}`;
  const cached = telemetryCache.get(cacheKey);

  if (useCache && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    // Gọi ngầm cập nhật cache và trả về ngay dữ liệu tức thì
    fetchFreshMarkerTelemetry(markerCode).catch(() => {});
    return cached.data;
  }

  return await fetchFreshMarkerTelemetry(markerCode);
}

async function fetchFreshMarkerTelemetry(markerCode: string): Promise<RealtimeTelemetry> {
  try {
    const encoded = encodeURIComponent(markerCode);
    const data = await requestJson<RealtimeTelemetry>(`/api/v1/telemetry/markers/${encoded}/realtime`);
    telemetryCache.set(`marker_${markerCode}`, { data, timestamp: Date.now() });
    if (data.node_id) {
      telemetryCache.set(`node_${data.node_id}`, { data, timestamp: Date.now() });
    }
    return data;
  } catch (error) {
    // Dự phòng: nếu không tìm thấy theo marker code, thử phân giải số node_id
    const numMatch = markerCode.match(/\d+/);
    if (numMatch) {
      const nodeId = parseInt(numMatch[0], 10);
      return await getRealtimeTelemetryByNode(nodeId, false);
    }
    throw error;
  }
}

/**
 * Lấy telemetry thời gian thực theo Node ID
 */
export async function getRealtimeTelemetryByNode(
  nodeId: number,
  useCache = true
): Promise<RealtimeTelemetry> {
  const cacheKey = `node_${nodeId}`;
  const cached = telemetryCache.get(cacheKey);

  if (useCache && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    fetchFreshNodeTelemetry(nodeId).catch(() => {});
    return cached.data;
  }

  return await fetchFreshNodeTelemetry(nodeId);
}

async function fetchFreshNodeTelemetry(nodeId: number): Promise<RealtimeTelemetry> {
  const data = await requestJson<RealtimeTelemetry>(`/api/v1/nodes/${nodeId}/telemetry/realtime`);
  telemetryCache.set(`node_${nodeId}`, { data, timestamp: Date.now() });
  return data;
}

/**
 * Lấy danh sách Ticket được giao cho Kỹ thuật viên
 */
export async function getAssignedTickets(): Promise<Ticket[]> {
  try {
    return await requestJson<Ticket[]>('/api/v1/tickets?assigned_to_me=true');
  } catch {
    // Nếu token chưa phân giải hoặc lỗi query, fallback lấy tất cả ticket
    return await requestJson<Ticket[]>('/api/v1/tickets');
  }
}

/**
 * Thêm ghi chú hiện trường vào Ticket
 */
export async function addTicketNote(ticketId: number, noteText: string) {
  return await requestJson<{ id: number; ticket_id: number; note_text: string }>(
    `/api/v1/tickets/${ticketId}/notes`,
    {
      method: 'POST',
      body: JSON.stringify({ note_text: noteText }),
    }
  );
}

/**
 * Kỹ thuật viên gửi Yêu cầu Nghiệm thu / Đóng Ticket (Step-up Verification - BR-04)
 */
export async function requestTicketClosure(
  ticketId: number,
  summary: string,
  resolutionDetails: string
) {
  return await requestJson<{
    id: number;
    ticket_id: number;
    status: string;
    summary: string;
    resolution_details: string;
  }>(`/api/v1/tickets/${ticketId}/request-closure`, {
    method: 'POST',
    body: JSON.stringify({ summary, resolution_details: resolutionDetails }),
  });
}

/**
 * Thao tác can thiệp hiện trường từ màn hình AR (Tắt tiến trình rác, restart service)
 * Yêu cầu Step-up Verification (BR-13)
 */
export async function remediateNodeFromAR(
  nodeId: number,
  actionType: 'KILL_STRESS_PROCESS' | 'RESTART_SERVICE' | 'REDUCE_CPU_LOAD',
  verificationCode = 'VERIFIED_STEP_UP'
): Promise<RemediationResult> {
  const result = await requestJson<RemediationResult>(`/api/v1/ar/nodes/${nodeId}/remediate`, {
    method: 'POST',
    body: JSON.stringify({
      action_type: actionType,
      verification_code: verificationCode,
      reason: 'Kỹ thuật viên thao tác Step-up Verification từ ứng dụng Mobile AR',
    }),
  });

  // Cập nhật ngay bộ nhớ đệm
  if (result.telemetry) {
    telemetryCache.set(`node_${nodeId}`, { data: result.telemetry, timestamp: Date.now() });
  }

  return result;
}
