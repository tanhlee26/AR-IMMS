import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider, useApp } from './src/context/AppContext';
import { Header } from './src/components/common/Header';
import { NavigationBar } from './src/components/common/NavigationBar';
import { NotificationBanner } from './src/components/notifications/NotificationBanner';
import { SettingsModal } from './src/components/modals/SettingsModal';
import { ARScanScreen } from './src/screens/ARScanScreen';
import { TicketsScreen } from './src/screens/TicketsScreen';

function MainNavigator(): React.JSX.Element {
  const [currentTab, setCurrentTab] = useState<'AR_SCAN' | 'TICKETS'>('AR_SCAN');
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const { selectSimulatedNode } = useApp();

  const handleNotificationPress = (nodeId?: number) => {
    if (nodeId) {
      const formattedNodeId = `NODE-${String(nodeId).padStart(2, '0')}`;
      selectSimulatedNode(formattedNodeId);
      setCurrentTab('AR_SCAN');
    } else {
      setCurrentTab('TICKETS');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Thanh Header AR-IMMS */}
      <Header onOpenSettings={() => setSettingsModalVisible(true)} />

      {/* Thông báo đẩy nổi phía trên */}
      <NotificationBanner onPressNotification={handleNotificationPress} />

      {/* Màn hình chính */}
      <View style={styles.contentArea}>
        {currentTab === 'AR_SCAN' ? (
          <ARScanScreen />
        ) : (
          <TicketsScreen onNavigateToARScan={() => setCurrentTab('AR_SCAN')} />
        )}
      </View>

      {/* Thanh điều hướng tab phía dưới */}
      <NavigationBar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Modal Cài đặt Backend & Giả lập */}
      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <MainNavigator />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
});

export default App;