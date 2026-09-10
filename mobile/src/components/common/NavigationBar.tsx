import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';

interface NavigationBarProps {
  currentTab: 'AR_SCAN' | 'TICKETS';
  onSelectTab: (tab: 'AR_SCAN' | 'TICKETS') => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { unreadTicketsCount } = useApp();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.tabItem,
          currentTab === 'AR_SCAN' && styles.activeTabItem,
        ]}
        onPress={() => onSelectTab('AR_SCAN')}
        activeOpacity={0.7}
      >
        <Text style={styles.tabIcon}>📷</Text>
        <Text
          style={[
            styles.tabText,
            currentTab === 'AR_SCAN' && styles.activeTabText,
          ]}
        >
          Camera AR
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabItem,
          currentTab === 'TICKETS' && styles.activeTabItem,
        ]}
        onPress={() => onSelectTab('TICKETS')}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <Text style={styles.tabIcon}>📋</Text>
          {unreadTicketsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadTicketsCount}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabText,
            currentTab === 'TICKETS' && styles.activeTabText,
          ]}
        >
          Phiếu Ticket
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabItem: {
    borderTopWidth: 2,
    borderTopColor: '#38BDF8',
  },
  iconWrapper: {
    position: 'relative',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
