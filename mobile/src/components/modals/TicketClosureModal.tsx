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
import { requestTicketClosure } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface TicketClosureModalProps {
  visible: boolean;
  ticketId: number;
  ticketTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const TicketClosureModal: React.FC<TicketClosureModalProps> = ({
  visible,
  ticketId,
  ticketTitle,
  onClose,
  onSuccess,
}) => {
  const { refreshTickets } = useApp();
  const [summary, setSummary] = useState(
    'Đã kiểm tra hiện trường qua AR, tắt tiến trình gây nghẽn CPU và xác nhận nhiệt độ an toàn.'
  );
  const [resolutionDetails, setResolutionDetails] = useState(
    '1. Quét mã QR/ArUco định danh máy chủ.\n2. Thực hiện Step-up Verification hạ tải CPU thành công.\n3. Các chỉ số đo đạc CPU hạ xuống 18.5%, nhiệt độ 51°C.\n4. Đề nghị Vận hành viên phê duyệt đóng phiếu.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!summary.trim() || !resolutionDetails.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tóm tắt và chi tiết các bước xử lý.');
      return;
    }

    try {
      setIsSubmitting(true);
      await requestTicketClosure(ticketId, summary, resolutionDetails);
      await refreshTickets();

      Alert.alert(
        'Đã gửi Yêu cầu Nghiệm thu',
        'Yêu cầu đóng Ticket đã được chuyển sang trạng thái PENDING_CLOSURE và gửi tới Command Center để Vận hành viên phê duyệt.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Lỗi gửi yêu cầu', err?.message || 'Không thể gửi yêu cầu nghiệm thu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.headerIcon}>📋</Text>
            <View style={styles.headerTitleCol}>
              <Text style={styles.title}>YÊU CẦU NGHIỆM THU TICKET (BR-04)</Text>
              <Text style={styles.subTitle} numberOfLines={1}>
                {ticketTitle} (Ticket #{ticketId})
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>TÓM TẮT KẾT QUẢ XỬ LÝ (SUMMARY):</Text>
              <TextInput
                style={styles.input}
                value={summary}
                onChangeText={setSummary}
                placeholder="Nhập tóm tắt nghiệm thu"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CHI TIẾT CÁC BƯỚC KHẮC PHỤC (RESOLUTION DETAILS):</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={resolutionDetails}
                onChangeText={setResolutionDetails}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholder="Mô tả chi tiết các bước kiểm tra, thao tác hiện trường"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Sau khi gửi, Ticket sẽ chuyển sang trạng thái <Text style={styles.boldText}>PENDING_CLOSURE</Text>.
                Vận hành viên (Operator) sẽ đối soát đồ thị telemetry trên Web Command Center trước khi phê duyệt đóng hoàn toàn.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelText}>Đóng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>GỬI YÊU CẦU NGHIỆM THU</Text>
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
    borderColor: '#38BDF8',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  headerTitleCol: {
    flex: 1,
  },
  title: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '900',
  },
  subTitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  body: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 12,
  },
  textArea: {
    height: 100,
  },
  infoBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  boldText: {
    color: '#38BDF8',
    fontWeight: '800',
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
  submitBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
