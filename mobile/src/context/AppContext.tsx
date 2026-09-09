import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { RealtimeTelemetry } from '../types/telemetry';
import { Ticket, PushNotificationItem } from '../types/ticket';
import { DetectedMarker } from '../types/marker';
import { getApiBaseUrl, setApiBaseUrl, getRealtimeTelemetryByMarker, getRealtimeTelemetryByNode, getAssignedTickets } from '../services/api';
import { wsClient } from '../services/websocket';
import { MARKER_MAPPINGS } from '../services/markerService';

interface AppContextType {
  backendUrl: string;
  updateBackendUrl: (url: string) => void;
  isWsConnected: boolean;
  activeMarker: DetectedMarker | null;
  setActiveMarker: (marker: DetectedMarker | null) => void;
  activeTelemetry: RealtimeTelemetry | null;
  setActiveTelemetry: (telemetry: RealtimeTelemetry | null) => void;
  isLoadingTelemetry: boolean;
  assignedTickets: Ticket[];
  unreadTicketsCount: number;
  refreshTickets: () => Promise<void>;
  notifications: PushNotificationItem[];
  activeBanner: PushNotificationItem | null;
  dismissBanner: () => void;
  simulatorMode: boolean;
  setSimulatorMode: (enabled: boolean) => void;
  selectSimulatedNode: (nodeIdStr: string) => void;
  targetTicketNodeId: number | null;
  setTargetTicketNodeId: (nodeId: number | null) => void;
}

const AppContext = createContext<AppContextType>({
  backendUrl: 'http://10.0.2.2:5000',
  updateBackendUrl: () => {},
  isWsConnected: false,
  activeMarker: null,
  setActiveMarker: () => {},
  activeTelemetry: null,
  setActiveTelemetry: () => {},
  isLoadingTelemetry: false,
  assignedTickets: [],
  unreadTicketsCount: 0,
  refreshTickets: async () => {},
  notifications: [],
  activeBanner: null,
  dismissBanner: () => {},
  simulatorMode: false,
  setSimulatorMode: () => {},
  selectSimulatedNode: () => {},
  targetTicketNodeId: null,
  setTargetTicketNodeId: () => {},
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [backendUrl, setBackendUrlState] = useState<string>(getApiBaseUrl());
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [activeMarker, setActiveMarker] = useState<DetectedMarker | null>(null);
  const [activeTelemetry, setActiveTelemetry] = useState<RealtimeTelemetry | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState<boolean>(false);
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);
  const [activeBanner, setActiveBanner] = useState<PushNotificationItem | null>(null);
  const [simulatorMode, setSimulatorMode] = useState<boolean>(false);
  const [targetTicketNodeId, setTargetTicketNodeId] = useState<number | null>(null);

  // Cập nhật URL Backend
  const updateBackendUrl = useCallback((url: string) => {
    setApiBaseUrl(url);
    setBackendUrlState(url);
    wsClient.disconnect();
    wsClient.connect(url);
  }, []);

  // Đẩy thông báo Push Banner
  const pushNotification = useCallback((item: Omit<PushNotificationItem, 'id' | 'timestamp' | 'isRead'>) => {
    const newItem: PushNotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [newItem, ...prev.slice(0, 49)]);
    setActiveBanner(newItem);
  }, []);

  const dismissBanner = useCallback(() => {
    setActiveBanner(null);
  }, []);

  // Lấy danh sách Ticket
  const refreshTickets = useCallback(async () => {
    try {
      const tickets = await getAssignedTickets();
      setAssignedTickets(tickets);
    } catch (e) {
      console.warn('Failed to fetch tickets:', e);
    }
  }, []);

  // Kết nối WebSocket và thiết lập listeners
  useEffect(() => {
    wsClient.connect(backendUrl);

    const unsubWsStatus = wsClient.onConnectionChange((connected) => {
      setIsWsConnected(connected);
    });

    const unsubTelemetry = wsClient.onTelemetryUpdate((telemetry) => {
      setActiveTelemetry((current) => {
        if (current && current.node_id === telemetry.node_id) {
          return { ...current, ...telemetry };
        }
        return current;
      });
    });

    const unsubAlerts = wsClient.onAlertEvent((alertData) => {
      pushNotification({
        title: alertData.status === 'RESOLVED' ? 'Sự cố đã được xử lý' : 'CẢNH BÁO SỰ CỐ MỚI!',
        message: alertData.message || `Cảnh báo máy chủ ID ${alertData.node_id}`,
        type: 'ALERT',
        severity: alertData.status === 'RESOLVED' ? 'INFO' : 'CRITICAL',
        nodeId: alertData.node_id,
      });
      refreshTickets();
    });

    const unsubNodeStatus = wsClient.onNodeStatusChange((statusData) => {
      setActiveTelemetry((current) => {
        if (current && current.node_id === statusData.node_id) {
          return { ...current, status: statusData.status };
        }
        return current;
      });
    });

    refreshTickets();

    return () => {
      unsubWsStatus();
      unsubTelemetry();
      unsubAlerts();
      unsubNodeStatus();
      wsClient.disconnect();
    };
  }, [backendUrl, pushNotification, refreshTickets]);

  // Tự động tắt banner sau 5 giây
  useEffect(() => {
    if (activeBanner) {
      const timer = setTimeout(() => {
        setActiveBanner(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeBanner]);

  // Khi activeMarker thay đổi, tải Telemetry tương ứng (áp dụng Cache-First < 50ms)
  useEffect(() => {
    if (!activeMarker) return;

    let isMounted = true;
    setIsLoadingTelemetry(true);

    const loadData = async () => {
      try {
        const rawCode = activeMarker.rawCode;
        const telemetry = await getRealtimeTelemetryByMarker(rawCode, true);
        if (isMounted) {
          setActiveTelemetry(telemetry);
          wsClient.subscribeNode(telemetry.node_id);
        }
      } catch {
        // Fallback: nếu lỗi mã marker, dùng node_id đã normalize
        try {
          const numMatch = activeMarker.normalizedNodeId.match(/\d+/);
          if (numMatch) {
            const nodeId = parseInt(numMatch[0], 10);
            const fallbackTelemetry = await getRealtimeTelemetryByNode(nodeId, true);
            if (isMounted) {
              setActiveTelemetry(fallbackTelemetry);
              wsClient.subscribeNode(nodeId);
            }
          }
        } catch (e2) {
          console.warn('Failed to load telemetry for marker:', e2);
        }
      } finally {
        if (isMounted) {
          setIsLoadingTelemetry(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeMarker]);

  // Helper chọn nhanh Node trong Simulator Mode
  const selectSimulatedNode = useCallback((nodeIdStr: string) => {
    const mapping = MARKER_MAPPINGS[nodeIdStr];
    if (!mapping) return;

    setActiveMarker({
      rawCode: mapping.qrContent,
      normalizedNodeId: nodeIdStr,
      markerType: 'QR',
      arucoId: mapping.arucoId,
      boundingBox: {
        left: 80,
        top: 160,
        right: 280,
        bottom: 360,
        width: 200,
        height: 200,
      },
      lastSeenTimestamp: Date.now(),
      confidence: 0.99,
    });
  }, []);

  const unreadTicketsCount = assignedTickets.filter(
    (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
  ).length;

  return (
    <AppContext.Provider
      value={{
        backendUrl,
        updateBackendUrl,
        isWsConnected,
        activeMarker,
        setActiveMarker,
        activeTelemetry,
        setActiveTelemetry,
        isLoadingTelemetry,
        assignedTickets,
        unreadTicketsCount,
        refreshTickets,
        notifications,
        activeBanner,
        dismissBanner,
        simulatorMode,
        setSimulatorMode,
        selectSimulatedNode,
        targetTicketNodeId,
        setTargetTicketNodeId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
