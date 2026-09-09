import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  TouchableOpacity,
  NativeModules,
  Modal,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import RNFS from 'react-native-fs';

const { ArucoModule } = NativeModules;

type Mode = 'qr' | 'aruco';

function App(): React.JSX.Element {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isScanningPaused, setIsScanningPaused] = useState(false);
  const [mode, setMode] = useState<Mode>('qr');
  const [arucoResult, setArucoResult] = useState<string>('');
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length === 0 || isScanningPaused) return;

      const scannedValue = codes[0].value ?? '';
      setLastScanned(scannedValue);
      setIsScanningPaused(true);

      Alert.alert('Đã quét được mã QR', `Nội dung: ${scannedValue}`, [
        { text: 'Quét tiếp', onPress: () => setIsScanningPaused(false) },
      ]);
    },
  });

  const handleDetectAruco = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      setArucoResult('Đang chụp và detect...');
      const photo = await cameraRef.current.takePhoto();
      const base64 = await RNFS.readFile(photo.path, 'base64');
      const markers = await ArucoModule.detect(base64);

      if (markers.length === 0) {
        setArucoResult('Không tìm thấy marker nào');
      } else {
        setArucoResult(
          `Tìm thấy ${markers.length} marker: ID ${markers
            .map((m: any) => m.id)
            .join(', ')}`,
        );
      }
    } catch (e: any) {
      setArucoResult(`Lỗi: ${e.message}`);
    }
  }, []);

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Đang xin quyền Camera...</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Không tìm thấy Camera trên thiết bị</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!isScanningPaused}
        photo={true}
        codeScanner={mode === 'qr' ? codeScanner : undefined}
      />

      <Modal transparent visible={true} animationType="none">
        <View style={styles.modalRoot} pointerEvents="box-none">
          <View style={styles.modeSwitch}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'qr' && styles.modeButtonActive]}
              onPress={() => setMode('qr')}>
              <Text style={styles.modeButtonText}>QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'aruco' && styles.modeButtonActive]}
              onPress={() => setMode('aruco')}>
              <Text style={styles.modeButtonText}>ArUco</Text>
            </TouchableOpacity>
          </View>

          {mode === 'aruco' && (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleDetectAruco}>
              <Text style={styles.captureButtonText}>Chụp & Detect ArUco</Text>
            </TouchableOpacity>
          )}

          <View style={styles.overlay}>
            <Text style={styles.overlayText}>
              {mode === 'qr'
                ? lastScanned
                  ? `Lần quét gần nhất: ${lastScanned}`
                  : 'Đưa mã QR vào khung hình'
                : arucoResult || 'Bấm nút để detect marker'}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
  },
  text: { color: '#fff', fontSize: 16 },
  modalRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
  },
  overlayText: { color: '#fff', fontSize: 14, textAlign: 'center' },
  modeSwitch: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: { backgroundColor: '#2f6fed' },
  modeButtonText: { color: '#fff', fontWeight: '600' },
  captureButton: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    backgroundColor: '#2f6fed',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  captureButtonText: { color: '#fff', fontWeight: '700' },
});

export default App;