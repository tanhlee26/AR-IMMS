import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { remediateNodeFromAR } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface StepUpVerificationModalProps {
  visible: boolean;
  nodeId: number;
  nodeName: string;
  actionType: 'KILL_STRESS_PROCESS' | 'RESTART_SERVICE' | 'REDUCE_CPU_LOAD';
  onClose: () => void;
  onSuccess: () => void;
}

export const StepUpVerificationModal: React.FC<StepUpVerificationModalProps> = ({
  visible,
  nodeId,
  nodeName,
  actionType,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { setActiveTelemetry } = useApp();
  const [securityCode, setSecurityCode] = useState('STEPUP-2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedRisk, setConfirmedRisk] = useState(false);

  const getActionTitle = () => {
    switch (actionType) {
      case 'KILL_STRESS_PROCESS':
        return 'TẮT TIẾN TRÌNH RÁC / HẠ TẢI CPU';
      case 'RESTART_SERVICE':
        return 'KHỞI ĐỘNG LẠI CONTAINER DỊCH VỤ';
      default:
        return 'THAO TÁC CAN THIỆP HỆ THỐNG';
    }
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'KILL_STRESS_PROCESS':
        return 'Hành động này sẽ ngắt toàn bộ tiến trình stress test đang chiếm 100% CPU trên máy chủ vật lý, đưa chỉ số tải về mức an toàn (<20%) và tự động giải phóng cảnh báo Critical Alert.';
      case 'RESTART_SERVICE':
        return 'Hành động này sẽ khởi động lại toàn bộ Docker containers đang lỗi trên node này.';
      default:
        return 'Hành động can thiệp trực tiếp vào phần cứng máy chủ hiện trường.';
    }
  };

  const handleExecute = async () => {
    if (!confirmedRisk) {
      Alert.alert('Cảnh báo an toàn', 'Vui lòng tích chọn đồng ý chịu trách nhiệm thao tác hiện trường.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await remediateNodeFromAR(nodeId, actionType, securityCode);

      if (res && res.telemetry) {
        setActiveTelemetry(res.telemetry);
      }

      Alert.alert(
        'Thành công (Step-up Verified)',
        res.summary || 'Đã thực hiện can thiệp hệ thống thành công! Dữ liệu CPU đã hạ nhiệt.',
        [
          {
            text: 'Xong',
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Lỗi thao tác', err?.message || 'Không thể thực hiện thao tác can thiệp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header cảnh báo nguy hiểm */}
          <View style={styles.header}>
            <Text style={styles.warningIcon}>🛡️</Text>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>XÁC THỰC 2 BƯỚC (BR-13)</Text>
              <Text style={styles.headerSub}>Step-up Verification for Critical Actions</Text>
            </View>
          </View>

          {/* Chi tiết thao tác */}
          <View style={styles.body}>
            <View style={styles.actionBanner}>
              <Text style={styles.actionLabel}>THAO TÁC CAN THIỆP:</Text>
              <Text style={styles.actionTitle}>{getActionTitle()}</Text>
              <Text style={styles.nodeTarget}>
                Mục tiêu: {nodeName} (ID #{nodeId})
              </Text>
            </View>

            <Text style={styles.descriptionText}>{getActionDescription()}</Text>

            {/* Bước 1: Xác nhận rủi ro */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setConfirmedRisk((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, confirmedRisk && styles.checkboxChecked]}>
                {confirmedRisk && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Tôi xác nhận đang đứng trực tiếp trước máy chủ và chịu trách nhiệm về thao tác này.
              </Text>
            </TouchableOpacity>

            {/* Bước 2: Mã bảo mật xác thực */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MÃ PHÊ DUYỆT HIỆN TRƯỜNG (SECURITY CODE):</Text>
              <TextInput
                style={styles.input}
                value={securityCode}
                onChangeText={setSecurityCode}
                placeholder="Nhập mã xác thực"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.auditNotice}>
              <Text style={styles.auditText}>
                🔒 Hành động này sẽ được ghi vào Nhật ký Kiểm toán Bất biến (Immutable Audit Log) với danh tính:{' '}
                <Text style={styles.boldText}>{user?.full_name || 'Kỹ thuật viên'}</Text>.
              </Text>
            </View>
          </View>

          {/* Footer nút hành động */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelText}>Hủy Bỏ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!confirmedRisk || isSubmitting) && styles.btnDisabled,
              ]}
              onPress={handleExecute}
              disabled={!confirmedRisk || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmText}>XÁC NHẬN THỰC HIỆN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.3)',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 10,
  },
  body: {
    padding: 16,
  },
  actionBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    marginBottom: 12,
  },
  actionLabel: {
    color: '#F87171',
    fontSize: 9,
    fontWeight: '800',
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  nodeTarget: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  descriptionText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  checkboxLabel: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  auditNotice: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  auditText: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 14,
  },
  boldText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
