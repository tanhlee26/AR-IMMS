import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { CodeScanner } from 'react-native-vision-camera-barcode-scanner';

function App(): React.JSX.Element {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isScanningPaused, setIsScanningPaused] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleBarcodeScanned = useCallback((barcodes: { rawValue: string }[]) => {
    if (barcodes.length === 0 || isScanningPaused) return;

    const scannedValue = barcodes[0].rawValue;
    setLastScanned(scannedValue);
    setIsScanningPaused(true);

    Alert.alert(
      'Đã quét được mã QR',
      `Nội dung: ${scannedValue}`,
      [
        {
          text: 'Quét tiếp',
          onPress: () => setIsScanningPaused(false),
        },
      ]
    );
  }, [isScanningPaused]);

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
      <CodeScanner
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!isScanningPaused}
        barcodeFormats={['qr-code']}
        onBarcodeScanned={handleBarcodeScanned}
        onError={(error) => console.error('Code scanner failed:', error)}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {lastScanned ? `Lần quét gần nhất: ${lastScanned}` : 'Đưa mã QR vào khung hình'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
  },
  text: {
    color: '#fff',
    fontSize: 16,
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
  overlayText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default App;