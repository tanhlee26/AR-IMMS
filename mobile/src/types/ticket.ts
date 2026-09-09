export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_CLOSURE' | 'CLOSED';

export interface TicketNote {
  id: number;
  ticket_id: number;
  user_id: number;
  username?: string;
  note_text: string;
  created_at: string;
}

export interface TicketClosureRequest {
  id: number;
  ticket_id: number;
  requested_by_user_id: number;
  summary: string;
  resolution_details: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  node_id: number;
  node_name?: string;
  node_hostname?: string;
  created_by_user_id: number;
  created_by_name?: string;
  assigned_to_user_id?: number;
  assigned_to_name?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  notes?: TicketNote[];
  closure_request?: TicketClosureRequest;
}

export interface PushNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'ALERT' | 'TICKET' | 'INFO' | 'SUCCESS';
  severity?: 'CRITICAL' | 'WARNING' | 'INFO';
  timestamp: string;
  nodeId?: number;
  ticketId?: number;
  isRead: boolean;
}
