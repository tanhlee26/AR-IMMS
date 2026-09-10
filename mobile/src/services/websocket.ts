import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './api';
import { RealtimeTelemetry } from '../types/telemetry';

export type TelemetryUpdateListener = (data: RealtimeTelemetry) => void;
export type AlertEventListener = (data: {
  alert_id?: number;
  node_id: number;
  status: string;
  message: string;
  severity?: string;
}) => void;
export type NodeStatusListener = (data: {
  node_id: number;
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'UNAVAILABLE';
  timestamp: string;
}) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private telemetryListeners: Set<TelemetryUpdateListener> = new Set();
  private alertListeners: Set<AlertEventListener> = new Set();
  private nodeStatusListeners: Set<NodeStatusListener> = new Set();
  private connectionStatusListeners: Set<(connected: boolean) => void> = new Set();
  private currentSubscribedNodeId: number | null = null;

  public connect(customBaseUrl?: string) {
    const url = customBaseUrl || getApiBaseUrl();

    if (this.socket) {
      this.disconnect();
    }

    try {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        query: {
          client_type: 'mobile_ar',
        },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.notifyConnectionChange(true);
        if (this.currentSubscribedNodeId) {
          this.subscribeNode(this.currentSubscribedNodeId);
        }
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.notifyConnectionChange(false);
      });

      this.socket.on('connect_error', () => {
        this.isConnected = false;
        this.notifyConnectionChange(false);
      });

      this.socket.on('telemetry_update', (data: RealtimeTelemetry) => {
        this.telemetryListeners.forEach((listener) => {
          try {
            listener(data);
          } catch (e) {
            console.warn('Error in telemetry listener:', e);
          }
        });
      });

      this.socket.on('alert_event', (data: any) => {
        this.alertListeners.forEach((listener) => {
          try {
            listener(data);
          } catch (e) {
            console.warn('Error in alert listener:', e);
          }
        });
      });

      this.socket.on('node_status_change', (data: any) => {
        this.nodeStatusListeners.forEach((listener) => {
          try {
            listener(data);
          } catch (e) {
            console.warn('Error in node status listener:', e);
          }
        });
      });
    } catch (err) {
      console.warn('WebSocket initialization failed, running in offline/polling mode:', err);
    }
  }

  public subscribeNode(nodeId: number) {
    this.currentSubscribedNodeId = nodeId;
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_node', { node_id: nodeId });
    }
  }

  public unsubscribeNode() {
    this.currentSubscribedNodeId = null;
  }

  public onTelemetryUpdate(listener: TelemetryUpdateListener): () => void {
    this.telemetryListeners.add(listener);
    return () => this.telemetryListeners.delete(listener);
  }

  public onAlertEvent(listener: AlertEventListener): () => void {
    this.alertListeners.add(listener);
    return () => this.alertListeners.delete(listener);
  }

  public onNodeStatusChange(listener: NodeStatusListener): () => void {
    this.nodeStatusListeners.add(listener);
    return () => this.nodeStatusListeners.delete(listener);
  }

  public onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionStatusListeners.add(listener);
    listener(this.isConnected);
    return () => this.connectionStatusListeners.delete(listener);
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionStatusListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (e) {
        console.warn('Error in connection listener:', e);
      }
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifyConnectionChange(false);
  }
}

export const wsClient = new WebSocketClient();
