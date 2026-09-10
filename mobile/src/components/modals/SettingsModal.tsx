import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { backendUrl, updateBackendUrl, isWsConnected, simulatorMode, setSimulatorMode, refreshTickets } =
    useApp();
  const { user, login } = useAuth();
  const [urlInput, setUrlInput] = useState(backendUrl);

  const handleSaveUrl = async () => {
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      Alert.alert('Lỗi', 'URL không được để trống.');
      return;
    }
    updateBackendUrl(cleanUrl);
    try {
      await login();
      await refreshTickets();
      Alert.alert('Thành công', `Đã kết nối Backend: ${cleanUrl}`);
    } catch {
      Alert.alert('Thông báo', `Đã cập nhật Backend URL: ${cleanUrl}`);
    }
  };

  const setPresetUrl = async (preset: string) => {
    setUrlInput(preset);
    updateBackendUrl(preset);
    try {
      await login();
      await refreshTickets();
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⚙️ CÀI ĐẶT HỆ THỐNG AR-IMMS</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Thông tin tài khoản Kỹ thuật viên */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TÀI KHOẢN KỸ THUẬT VIÊN (FIELD TECH)</Text>
              <View style={styles.profileBox}>
                <Text style={styles.profileName}>{user?.full_name || 'Le Van Technician'}</Text>
                <Text style={styles.profileRole}>Vai trò: {user?.role || 'FIELD_TECHNICIAN'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'tech@ar-imms.vn'}</Text>
              </View>
            </View>

            {/* Cấu hình IP Backend */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>ĐỊA CHỈ MÁY CHỦ BACKEND API</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isWsConnected ? styles.connectedBadge : styles.disconnectedBadge,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {isWsConnected ? 'ĐÃ KẾT NỐI' : 'MẤT KẾT NỐI'}
                  </Text>
                </View>
              </View>

              <TextInput
                style={styles.input}
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="http://10.0.2.2:5000"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveUrl}>
                <Text style={styles.saveUrlText}>Lưu & Thử Kết Nối Lại</Text>
              </TouchableOpacity>

              <View style={styles.presetsRow}>
                <Text style={styles.presetLabel}>Gợi ý nhanh:</Text>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => setPresetUrl('http://10.0.2.2:5000')}
                >
                  <Text style={styles.presetChipText}>Emulator (10.0.2.2)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => setPresetUrl('http://localhost:5000')}
                >
                  <Text style={styles.presetChipText}>Localhost</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tùy chọn Chế độ Giả lập */}
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <View style={styles.switchTextCol}>
                  <Text style={styles.sectionTitle}>CHẾ ĐỘ GIẢ LẬP CAMERA (SIMULATOR)</Text>
                  <Text style={styles.switchDesc}>
                    Bật để test nhanh 4 máy chủ mà không cần camera vật lý.
                  </Text>
                </View>
                <Switch
                  value={simulatorMode}
                  onValueChange={setSimulatorMode}
                  trackColor={{ false: '#334155', true: '#0284C7' }}
                  thumbColor={simulatorMode ? '#38BDF8' : '#94A3B8'}
                />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneText}>Hoàn Tất</Text>
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
    borderColor: '#334155',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  body: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  connectedBadge: {
    backgroundColor: '#10B981',
  },
  disconnectedBadge: {
    backgroundColor: '#F59E0B',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  profileBox: {
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  profileRole: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  profileEmail: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  saveUrlBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveUrlText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  presetLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  presetChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetChipText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  switchDesc: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  footer: {
    padding: 12,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  doneBtn: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
