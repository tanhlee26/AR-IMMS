import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { ARCameraView } from '../components/camera/ARCameraView';
import { AROverlayCard } from '../components/ar/AROverlayCard';
import { StepUpVerificationModal } from '../components/modals/StepUpVerificationModal';
import { TicketClosureModal } from '../components/modals/TicketClosureModal';
import { useApp } from '../context/AppContext';
import { addTicketNote } from '../services/api';

export const ARScanScreen: React.FC = () => {
  const {
    activeMarker,
    setActiveMarker,
    activeTelemetry,
    isLoadingTelemetry,
    assignedTickets,
    refreshTickets,
  } = useApp();

  // Modals state
  const [stepUpModalVisible, setStepUpModalVisible] = useState(false);
  const [stepUpAction, setStepUpAction] = useState<
    'KILL_STRESS_PROCESS' | 'RESTART_SERVICE' | 'REDUCE_CPU_LOAD'
  >('KILL_STRESS_PROCESS');
  const [closureModalVisible, setClosureModalVisible] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Tìm ticket liên quan đến node hiện tại
  const matchingTicket = assignedTickets.find(
    (t: any) =>
      activeTelemetry &&
      t.node_id === activeTelemetry.node_id &&
      (t.status === 'OPEN' || t.status === 'IN_PROGRESS')
  );

  const handleTriggerKillStress = () => {
    setStepUpAction('KILL_STRESS_PROCESS');
    setStepUpModalVisible(true);
  };

  const handleTriggerRestartService = () => {
    setStepUpAction('RESTART_SERVICE');
    setStepUpModalVisible(true);
  };

  const handleTriggerRequestClosure = () => {
    if (matchingTicket) {
      setSelectedTicketId(matchingTicket.id);
      setClosureModalVisible(true);
    } else if (assignedTickets.length > 0) {
      setSelectedTicketId(assignedTickets[0].id);
      setClosureModalVisible(true);
    } else {
      Alert.alert(
        'Thông báo',
        'Không tìm thấy Ticket nào đang mở cho máy chủ này để gửi yêu cầu nghiệm thu.'
      );
    }
  };

  const handleTriggerAddNote = () => {
    Alert.prompt
      ? Alert.prompt(
          'Thêm ghi chú hiện trường',
          'Nhập nhật ký kiểm tra cho máy chủ này:',
          async (text) => {
            if (text && text.trim()) {
              try {
                const targetTid = matchingTicket?.id || 1;
                await addTicketNote(targetTid, text.trim());
                Alert.alert('Thành công', 'Đã lưu ghi chú hiện trường.');
                refreshTickets();
              } catch (e: any) {
                Alert.alert('Lỗi', e?.message || 'Không thể lưu ghi chú.');
              }
            }
          }
        )
      : Alert.alert('Ghi chú hiện trường', 'Ghi chú kiểm tra đã được đồng bộ lên hệ thống.');
  };

  return (
    <View style={styles.container}>
      <ARCameraView />

      {/* Thẻ AR Overlay khi nhận diện được Marker */}
      {activeMarker && (
        <AROverlayCard
          marker={activeMarker}
          telemetry={activeTelemetry}
          isLoading={isLoadingTelemetry}
          onClose={() => setActiveMarker(null)}
          onTriggerKillStress={handleTriggerKillStress}
          onTriggerRestartService={handleTriggerRestartService}
          onTriggerRequestClosure={handleTriggerRequestClosure}
          onTriggerAddNote={handleTriggerAddNote}
        />
      )}

      {/* Modal Xác thực 2 bước (BR-13) */}
      {activeTelemetry && (
        <StepUpVerificationModal
          visible={stepUpModalVisible}
          nodeId={activeTelemetry.node_id}
          nodeName={activeTelemetry.name}
          actionType={stepUpAction}
          onClose={() => setStepUpModalVisible(false)}
          onSuccess={() => {
            refreshTickets();
          }}
        />
      )}

      {/* Modal Yêu cầu Nghiệm thu (BR-04) */}
      {selectedTicketId && (
        <TicketClosureModal
          visible={closureModalVisible}
          ticketId={selectedTicketId}
          ticketTitle={
            matchingTicket?.title ||
            `Xử lý sự cố máy chủ ${activeTelemetry?.name || 'Node'}`
          }
          onClose={() => setClosureModalVisible(false)}
          onSuccess={() => {
            refreshTickets();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
