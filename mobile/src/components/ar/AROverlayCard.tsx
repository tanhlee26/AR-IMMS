import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { RealtimeTelemetry } from '../../types/telemetry';
import { DetectedMarker } from '../../types/marker';
import { MetricGauge } from './MetricGauge';
import { ARActionToolbar } from './ARActionToolbar';
import { getStatusColor, getStatusLabel, formatMemory } from '../../utils/formatters';

interface AROverlayCardProps {
  marker: DetectedMarker;
  telemetry: RealtimeTelemetry | null;
  isLoading: boolean;
  onClose: () => void;
  onTriggerKillStress: () => void;
  onTriggerRestartService: () => void;
  onTriggerRequestClosure: () => void;
  onTriggerAddNote: () => void;
}

export const AROverlayCard: React.FC<AROverlayCardProps> = ({
  marker,
  telemetry,
  isLoading,
  onClose,
  onTriggerKillStress,
  onTriggerRestartService,
  onTriggerRequestClosure,
  onTriggerAddNote,
}) => {
  const statusColor = getStatusColor(telemetry?.status);
  const statusLabel = getStatusLabel(telemetry?.status);

  const getMetricNum = (m: any): number | undefined => {
    if (typeof m === 'number') return m;
    if (m && typeof m.value === 'number') return m.value;
    return undefined;
  };

  const cpuVal = getMetricNum(telemetry?.metrics?.cpu_usage_percent);
  const ramVal = getMetricNum(telemetry?.metrics?.memory_usage_percent);
  const tempVal = getMetricNum(telemetry?.metrics?.temperature_celsius);
  const powerWatts = telemetry?.power_consumption_watts || 250;
  const activeAlerts = telemetry?.active_alerts || [];
  const hasCritical = activeAlerts.some((a) => a.severity === 'CRITICAL');

  return (
    <View style={styles.cardWrapper}>
      <View
        style={[
          styles.cardContainer,
          { borderColor: statusColor },
          hasCritical && styles.criticalGlow,
        ]}
      >
        {/* Header: Mã Node, Tên máy chủ, Nút đóng */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.nodeIdText}>{marker.normalizedNodeId}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusBadgeText}>{statusLabel}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {isLoading && !telemetry ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text style={styles.loadingText}>Đang tải Telemetry thời gian thực...</Text>
          </View>
        ) : telemetry ? (
          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Thông tin định danh & Phân cấp Digital Twin */}
            <View style={styles.metaSection}>
              <Text style={styles.serverName} numberOfLines={1}>
                {telemetry.name}
              </Text>
              <Text style={styles.hierarchyText}>
                📍 {telemetry.hierarchy?.site_name} &gt; {telemetry.hierarchy?.rack_name} (U
                {telemetry.rack_position_u || 1})
              </Text>
              <Text style={styles.ipText}>
                🌐 IP: {telemetry.ip_address} | {telemetry.hostname} | ⚡ {powerWatts}W
              </Text>
            </View>

            {/* Các thanh đo phần cứng AR: CPU, RAM, Temp */}
            <View style={styles.gaugesContainer}>
              <MetricGauge
                label="CPU Load"
                value={cpuVal}
                unit="%"
                warningThreshold={80}
                criticalThreshold={90}
                icon="⚡"
                formattedSubtext={cpuVal && cpuVal >= 90 ? 'VƯỢT NGƯỠNG CRITICAL (>90%)' : 'Ổn định'}
              />

              <MetricGauge
                label="RAM Memory"
                value={ramVal}
                unit="%"
                warningThreshold={85}
                criticalThreshold={92}
                icon="💾"
                formattedSubtext={formatMemory(ramVal ? (ramVal * 160) : undefined)}
              />

              <MetricGauge
                label="Nhiệt độ CPU"
                value={tempVal}
                unit="°C"
                warningThreshold={65}
                criticalThreshold={80}
                icon="🌡️"
                formattedSubtext={tempVal && tempVal >= 80 ? 'QUÁ NHIỆT CẢNH BÁO' : 'Bình thường'}
              />
            </View>

            {/* Danh sách Alert đang kích hoạt (nếu có) */}
            {activeAlerts.length > 0 && (
              <View style={styles.alertsDrawer}>
                <Text style={styles.alertsTitle}>
                  ⚠️ CẢNH BÁO ĐANG MỞ ({activeAlerts.length}):
                </Text>
                {activeAlerts.map((alert) => (
                  <View
                    key={alert.id}
                    style={[
                      styles.alertItem,
                      alert.severity === 'CRITICAL' && styles.alertItemCritical,
                    ]}
                  >
                    <Text style={styles.alertMsg}>• {alert.message}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Thanh thao tác hiện trường AR & Step-up Verification */}
            <ARActionToolbar
              nodeId={telemetry.node_id}
              nodeName={telemetry.name}
              hasCriticalAlert={hasCritical}
              onTriggerKillStress={onTriggerKillStress}
              onTriggerRestartService={onTriggerRestartService}
              onTriggerRequestClosure={onTriggerRequestClosure}
              onTriggerAddNote={onTriggerAddNote}
            />
          </ScrollView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>Không thể đọc dữ liệu telemetry cho mã này.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    maxHeight: 440,
    zIndex: 900,
  },
  cardContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 14,
    borderWidth: 2,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  criticalGlow: {
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  nodeIdText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contentScroll: {
    maxHeight: 360,
  },
  loadingContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
  },
  metaSection: {
    marginBottom: 8,
  },
  serverName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  hierarchyText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  ipText: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  gaugesContainer: {
    marginVertical: 4,
  },
  alertsDrawer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    marginVertical: 6,
  },
  alertsTitle: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  alertItem: {
    marginVertical: 2,
  },
  alertItemCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 4,
    borderRadius: 4,
  },
  alertMsg: {
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: '600',
  },
});
