import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

interface ARActionToolbarProps {
  nodeId: number;
  nodeName: string;
  hasCriticalAlert: boolean;
  onTriggerKillStress: () => void;
  onTriggerRestartService: () => void;
  onTriggerRequestClosure: () => void;
  onTriggerAddNote: () => void;
}

export const ARActionToolbar: React.FC<ARActionToolbarProps> = ({
  nodeId,
  nodeName,
  hasCriticalAlert,
  onTriggerKillStress,
  onTriggerRestartService,
  onTriggerRequestClosure,
  onTriggerAddNote,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>THAO TÁC AR • {nodeName} (#{nodeId})</Text>
        {hasCriticalAlert && (
          <View style={styles.alertPulse}>
            <Text style={styles.alertPulseText}>CRITICAL SỰ CỐ</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonsGrid}>
        {/* Nút 1: Tắt tiến trình rác / Hạ tải CPU */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.dangerBtn]}
          onPress={onTriggerKillStress}
          activeOpacity={0.7}
        >
          <Text style={styles.btnIcon}>⚡</Text>
          <View style={styles.btnTextCol}>
            <Text style={styles.dangerBtnText}>Tắt tiến trình rác</Text>
            <Text style={styles.subBtnText}>Hạ tải CPU & Đóng Alert (Step-up)</Text>
          </View>
        </TouchableOpacity>

        {/* Nút 2: Khởi động lại Service */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.warningBtn]}
          onPress={onTriggerRestartService}
          activeOpacity={0.7}
        >
          <Text style={styles.btnIcon}>🔄</Text>
          <View style={styles.btnTextCol}>
            <Text style={styles.warningBtnText}>Khởi động lại Dịch vụ</Text>
            <Text style={styles.subBtnText}>Restart Container / Daemon</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          {/* Nút 3: Gửi Yêu cầu Nghiệm thu (BR-04) */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.successBtn]}
            onPress={onTriggerRequestClosure}
            activeOpacity={0.7}
          >
            <Text style={styles.btnIcon}>✅</Text>
            <Text style={styles.successBtnText}>Nghiệm thu Ticket</Text>
          </TouchableOpacity>

          {/* Nút 4: Thêm ghi chú hiện trường */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.infoBtn]}
            onPress={onTriggerAddNote}
            activeOpacity={0.7}
          >
            <Text style={styles.btnIcon}>📝</Text>
            <Text style={styles.infoBtnText}>Ghi chú</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertPulse: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  alertPulseText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  buttonsGrid: {
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  dangerBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  warningBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  successBtn: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
    justifyContent: 'center',
  },
  infoBtn: {
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
    justifyContent: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 6,
  },
  btnIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  btnTextCol: {
    flex: 1,
  },
  dangerBtnText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '800',
  },
  warningBtnText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
  },
  successBtnText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  infoBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  subBtnText: {
    color: '#CBD5E1',
    fontSize: 9,
  },
});
