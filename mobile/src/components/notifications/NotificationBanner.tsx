import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';

interface NotificationBannerProps {
  onPressNotification?: (nodeId?: number, ticketId?: number) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  onPressNotification,
}) => {
  const { activeBanner, dismissBanner } = useApp();

  if (!activeBanner) return null;

  const isCritical = activeBanner.severity === 'CRITICAL';

  return (
    <View
      style={[
        styles.container,
        isCritical ? styles.criticalBorder : styles.normalBorder,
      ]}
    >
      <TouchableOpacity
        style={styles.contentArea}
        onPress={() => {
          if (onPressNotification) {
            onPressNotification(activeBanner.nodeId, activeBanner.ticketId);
          }
          dismissBanner();
        }}
        activeOpacity={0.8}
      >
        <View style={styles.headerRow}>
          <Text style={styles.icon}>{isCritical ? '🚨' : '🔔'}</Text>
          <Text
            style={[
              styles.title,
              isCritical ? styles.criticalTitle : styles.normalTitle,
            ]}
            numberOfLines={1}
          >
            {activeBanner.title}
          </Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {activeBanner.message}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={dismissBanner}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  criticalBorder: {
    borderColor: '#EF4444',
  },
  normalBorder: {
    borderColor: '#38BDF8',
  },
  contentArea: {
    flex: 1,
    paddingRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
  },
  criticalTitle: {
    color: '#F87171',
  },
  normalTitle: {
    color: '#38BDF8',
  },
  message: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
