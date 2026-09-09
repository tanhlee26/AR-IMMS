import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { user } = useAuth();
  const { isWsConnected, simulatorMode } = useApp();

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>AR-IMMS</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{user?.role ? 'TECH' : 'FIELD AR'}</Text>
        </View>
        {simulatorMode && (
          <View style={[styles.badge, styles.simBadge]}>
            <Text style={styles.badgeText}>SIMULATOR</Text>
          </View>
        )}
      </View>

      <View style={styles.rightSection}>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              isWsConnected ? styles.liveStatusDot : styles.pollingStatusDot,
            ]}
          />
          <Text style={styles.statusText}>
            {isWsConnected ? 'LIVE WS' : 'POLLING'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 54,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#0369A1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  simBadge: {
    backgroundColor: '#7C3AED',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  liveStatusDot: {
    backgroundColor: '#10B981',
  },
  pollingStatusDot: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 16,
  },
});
