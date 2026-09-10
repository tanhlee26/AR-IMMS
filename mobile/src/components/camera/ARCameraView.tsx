import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { CodeScanner } from 'react-native-vision-camera-barcode-scanner';
import { useApp } from '../../context/AppContext';
import { resolveMarkerCode, getAllNodeMappings } from '../../services/markerService';
import { ARMotionTracker } from '../../utils/arTracking';
import { ViewfinderGuide } from './ViewfinderGuide';

interface ARCameraViewProps {
  onMotionUpdate?: (tracker: ARMotionTracker) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ARCameraView: React.FC<ARCameraViewProps> = ({ onMotionUpdate }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const {
    activeMarker,
    setActiveMarker,
    simulatorMode,
    setSimulatorMode,
    selectSimulatedNode,
  } = useApp();

  const motionTracker = useRef(new ARMotionTracker(0.35, 1500)).current;
  const lastScanTimestamp = useRef<number>(0);
  const [torchOn, setTorchOn] = useState(false);

  // Yêu cầu cấp quyền Camera
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Xử lý mã Barcode/QR từ Google MLKit
  const handleBarcodeScanned = useCallback(
    (barcodes: any[]) => {
      if (!barcodes || barcodes.length === 0) return;

      // Throttle quét 80ms để giữ 60fps mượt mà
      const now = Date.now();
      if (now - lastScanTimestamp.current < 80) return;
      lastScanTimestamp.current = now;

      const code = barcodes[0];
      const rawValue = code.rawValue || code.displayValue;
      if (!rawValue) return;

      const resolved = resolveMarkerCode(rawValue);
      if (!resolved) return;

      const box = code.boundingBox || {
        left: SCREEN_WIDTH / 2 - 80,
        top: SCREEN_HEIGHT / 2 - 80,
        right: SCREEN_WIDTH / 2 + 80,
        bottom: SCREEN_HEIGHT / 2 + 80,
      };

      motionTracker.updateTarget(box);
      if (onMotionUpdate) {
        onMotionUpdate(motionTracker);
      }

      setActiveMarker({
        rawCode: rawValue,
        normalizedNodeId: resolved.normalizedNodeId,
        markerType: resolved.markerType,
        arucoId: resolved.arucoId,
        boundingBox: box,
        cornerPoints: code.cornerPoints,
        lastSeenTimestamp: now,
        confidence: 0.98,
      });
    },
    [motionTracker, onMotionUpdate, setActiveMarker]
  );

  // Giao diện khi bật chế độ Giả lập Camera (Simulator / Emulation Testbed)
  if (simulatorMode) {
    const mappings = getAllNodeMappings();
    return (
      <View style={styles.container}>
        <View style={styles.simBackground}>
          <Text style={styles.simTitle}>MÔ PHỎNG TESTBED DATA CENTER (4 LAPTOPS)</Text>
          <Text style={styles.simSubtitle}>
            Chọn nhanh Máy chủ để giả lập quét mã QR / ArUco dán trên vỏ máy:
          </Text>

          <View style={styles.simNodeGrid}>
            {mappings.map((m) => {
              const isSelected = activeMarker?.normalizedNodeId === m.nodeId;
              return (
                <TouchableOpacity
                  key={m.nodeId}
                  style={[styles.simNodeCard, isSelected && styles.simNodeCardSelected]}
                  onPress={() => selectSimulatedNode(m.nodeId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.simCardHeader}>
                    <Text style={styles.simNodeId}>{m.nodeId}</Text>
                    <View style={styles.simBadge}>
                      <Text style={styles.simBadgeText}>ArUco #{m.arucoId}</Text>
                    </View>
                  </View>
                  <Text style={styles.simNodeName} numberOfLines={1}>
                    {m.nodeName}
                  </Text>
                  <Text style={styles.simHostname}>{m.hostname}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ViewfinderGuide
            isTargetLocked={!!activeMarker}
            statusMessage={
              activeMarker
                ? `ĐANG QUAN SÁT AR: ${activeMarker.normalizedNodeId}`
                : 'CHỌN MÁY CHỦ PHÍA TRÊN ĐỂ HIỂN THỊ AR OVERLAY'
            }
          />
        </View>

        {/* Nút thoát chế độ giả lập */}
        <TouchableOpacity
          style={styles.simToggleButton}
          onPress={() => setSimulatorMode(false)}
        >
          <Text style={styles.simToggleText}>Quay về Camera Thật 📷</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Nếu không có quyền camera hoặc thiết bị không có camera, hiển thị thông báo & nút chuyển sang Simulator
  if (!hasPermission || device == null) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackIcon}>📷</Text>
        <Text style={styles.fallbackTitle}>
          {!hasPermission ? 'Chưa cấp quyền Camera' : 'Không tìm thấy Camera vật lý'}
        </Text>
        <Text style={styles.fallbackSubtitle}>
          {!hasPermission
            ? 'Vui lòng cấp quyền Camera để quét mã QR / ArUco trên vỏ máy chủ Data Center.'
            : 'Thiết bị hoặc máy ảo chưa kết nối camera. Bạn có thể bật Chế độ Giả lập để kiểm thử ngay lập tức.'}
        </Text>

        {!hasPermission ? (
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Cấp Quyền Camera</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, styles.simButton]}
          onPress={() => setSimulatorMode(true)}
        >
          <Text style={styles.primaryButtonText}>Bật Chế độ Giả lập (Simulator Mode) 🚀</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CodeScanner
        style={StyleSheet.absoluteFill}
        isActive={true}
        barcodeFormats={['qr-code']}
        onBarcodeScanned={handleBarcodeScanned}
        onError={(err: any) => console.warn('Code scanner error:', err)}
      />

      <ViewfinderGuide isTargetLocked={!!activeMarker} />

      {/* Thanh điều khiển nhanh camera: Đèn Flash & Nút Simulator */}
      <View style={styles.cameraControls}>
        <TouchableOpacity
          style={[styles.controlButton, torchOn && styles.controlButtonActive]}
          onPress={() => setTorchOn((prev) => !prev)}
        >
          <Text style={styles.controlIcon}>{torchOn ? '🔦 BẬT' : '💡 ĐÈN'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setSimulatorMode(true)}
        >
          <Text style={styles.controlIcon}>🧪 MÔ PHỎNG</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.8)',
  },
  controlIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  simButton: {
    backgroundColor: '#7C3AED',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  simBackground: {
    flex: 1,
    backgroundColor: '#090D16',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  simTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  simSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  simNodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  simNodeCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  simNodeCardSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  simCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  simNodeId: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  simBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  simBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  simNodeName: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  simHostname: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  simToggleButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  simToggleText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
});
