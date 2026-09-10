import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface ViewfinderGuideProps {
  isTargetLocked: boolean;
  statusMessage?: string;
}

export const ViewfinderGuide: React.FC<ViewfinderGuideProps> = ({
  isTargetLocked,
  statusMessage,
}) => {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Khung ngắm AR HUD */}
      <View
        style={[
          styles.reticle,
          isTargetLocked ? styles.reticleLocked : styles.reticleScanning,
        ]}
      >
        {/* 4 Góc định vị */}
        <View style={[styles.corner, styles.topLeft, isTargetLocked && styles.cornerLocked]} />
        <View style={[styles.corner, styles.topRight, isTargetLocked && styles.cornerLocked]} />
        <View style={[styles.corner, styles.bottomLeft, isTargetLocked && styles.cornerLocked]} />
        <View style={[styles.corner, styles.bottomRight, isTargetLocked && styles.cornerLocked]} />

        {/* Tâm ngắm AR */}
        <View style={[styles.crosshair, isTargetLocked && styles.crosshairLocked]} />
      </View>

      {/* Thông điệp hướng dẫn phía dưới khung ngắm */}
      <View style={styles.guideTextContainer}>
        <Text style={styles.guideText}>
          {statusMessage ||
            (isTargetLocked
              ? '✓ ĐÃ KHÓA MỤC TIÊU AR'
              : 'HƯỚNG CAMERA VÀO MÃ QR / ARUCO DÁN TRÊN SERVER')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  reticleScanning: {
    backgroundColor: 'rgba(56, 189, 248, 0.03)',
  },
  reticleLocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#38BDF8',
  },
  cornerLocked: {
    borderColor: '#10B981',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  crosshair: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    opacity: 0.8,
  },
  crosshairLocked: {
    backgroundColor: '#10B981',
    transform: [{ scale: 1.4 }],
  },
  guideTextContainer: {
    position: 'absolute',
    bottom: 120,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  guideText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
