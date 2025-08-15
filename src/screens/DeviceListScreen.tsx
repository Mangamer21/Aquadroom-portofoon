import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  DeviceEventEmitter,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Device, ConnectionStatus} from '../types';
import {NetworkService} from '../services/NetworkService';
import {useNavigation} from '@react-navigation/native';

const DeviceListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectedDevices: [],
    lastUpdate: new Date(),
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDevices();
    updateConnectionStatus();

    // Set up event listeners
    const statusListener = DeviceEventEmitter.addListener(
      'connectionStatusChanged',
      handleConnectionStatusChange
    );

    return () => {
      statusListener.remove();
    };
  }, []);

  const loadDevices = useCallback(() => {
    const connectedDevices = NetworkService.getConnectedDevices();
    setDevices(connectedDevices);
  }, []);

  const updateConnectionStatus = useCallback(() => {
    const status = NetworkService.getConnectionStatus();
    setConnectionStatus(status);
  }, []);

  const handleConnectionStatusChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    setDevices(status.connectedDevices);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    // Trigger device discovery
    try {
      // In a real implementation, this would trigger a new discovery broadcast
      setTimeout(() => {
        loadDevices();
        updateConnectionStatus();
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to refresh devices:', error);
      setRefreshing(false);
    }
  }, [loadDevices, updateConnectionStatus]);

  const handleDevicePress = useCallback((device: Device) => {
    Alert.alert(
      device.name,
      'What would you like to do?',
      [
        {
          text: 'Start Individual Chat',
          onPress: () => startIndividualChat(device),
        },
        {
          text: 'View Details',
          onPress: () => showDeviceDetails(device),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, []);

  const startIndividualChat = useCallback((device: Device) => {
    navigation.navigate('IndividualChat' as never, {device} as never);
  }, [navigation]);

  const showDeviceDetails = useCallback((device: Device) => {
    const lastSeenText = device.lastSeen.toLocaleString();
    const deviceTypeText = device.deviceType === 'inrico_t320'
      ? 'Inrico T320 Radio'
      : device.deviceType === 'android'
        ? 'Android Device'
        : 'Unknown Device';

    Alert.alert(
      'Device Details',
      `Name: ${device.name}\n` +
      `Type: ${deviceTypeText}\n` +
      `IP Address: ${device.ipAddress}\n` +
      `Status: ${device.isOnline ? 'Online' : 'Offline'}\n` +
      `Last Seen: ${lastSeenText}`,
      [{text: 'OK'}]
    );
  }, []);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'inrico_t320':
        return 'radio';
      case 'android':
        return 'smartphone';
      default:
        return 'device-unknown';
    }
  };

  const getDeviceTypeLabel = (deviceType: string) => {
    switch (deviceType) {
      case 'inrico_t320':
        return 'Inrico T320';
      case 'android':
        return 'Android';
      default:
        return 'Unknown';
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {return 'Just now';}
    if (diffMins < 60) {return `${diffMins}m ago`;}
    if (diffHours < 24) {return `${diffHours}h ago`;}
    return `${diffDays}d ago`;
  };

  const renderDeviceItem = ({item}: {item: Device}) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => handleDevicePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.deviceIcon}>
        <Icon
          name={getDeviceIcon(item.deviceType)}
          size={24}
          color={item.isOnline ? '#007AFF' : '#999'}
        />
      </View>

      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceType}>{getDeviceTypeLabel(item.deviceType)}</Text>
        <Text style={styles.deviceIP}>{item.ipAddress}</Text>
      </View>

      <View style={styles.deviceStatus}>
        <View style={[
          styles.statusIndicator,
          {backgroundColor: item.isOnline ? '#4CAF50' : '#F44336'},
        ]} />
        <Text style={[
          styles.statusText,
          {color: item.isOnline ? '#4CAF50' : '#F44336'},
        ]}>
          {item.isOnline ? 'Online' : 'Offline'}
        </Text>
        <Text style={styles.lastSeenText}>
          {formatLastSeen(item.lastSeen)}
        </Text>
      </View>

      <Icon name="chevron-right" size={24} color="#CCC" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="devices" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No Devices Found</Text>
      <Text style={styles.emptySubtitle}>
        Pull down to refresh and discover devices on your network
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Icon name="refresh" size={20} color="white" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with network info */}
      <View style={styles.header}>
        <View style={styles.networkInfo}>
          <Icon
            name={connectionStatus.isConnected ? 'wifi' : 'wifi-off'}
            size={20}
            color={connectionStatus.isConnected ? '#4CAF50' : '#F44336'}
          />
          <Text style={styles.networkText}>
            {connectionStatus.wifiSSID || 'Not connected to WiFi'}
          </Text>
        </View>
        <Text style={styles.deviceCount}>
          {devices.length} device{devices.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Device list */}
      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={item => item.id}
        style={styles.deviceList}
        contentContainerStyle={devices.length === 0 ? styles.emptyListContainer : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to connect devices:</Text>
        <Text style={styles.instructionText}>
          • Ensure all devices are on the same WiFi network
        </Text>
        <Text style={styles.instructionText}>
          • Open the app on each device
        </Text>
        <Text style={styles.instructionText}>
          • Devices will automatically discover each other
        </Text>
        <Text style={styles.instructionText}>
          • Tap a device to start individual communication
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  networkText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  deviceCount: {
    fontSize: 14,
    color: '#666',
  },
  deviceList: {
    flex: 1,
  },
  emptyListContainer: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  deviceIP: {
    fontSize: 12,
    color: '#999',
  },
  deviceStatus: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  lastSeenText: {
    fontSize: 10,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionsContainer: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
});

export default DeviceListScreen;
