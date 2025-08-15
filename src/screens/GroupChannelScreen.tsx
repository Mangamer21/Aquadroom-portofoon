import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  DeviceEventEmitter,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {Device, AudioMessage, ConnectionStatus} from '../types';
import {NetworkService} from '../services/NetworkService';
import {PTTService} from '../services/PTTService';
import {AudioService} from '../services/AudioService';

interface ActiveSpeaker {
  deviceId: string;
  deviceName: string;
  startTime: Date;
}

const GroupChannelScreen: React.FC = () => {
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [isPTTPressed, setIsPTTPressed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<ActiveSpeaker[]>([]);
  const [recentMessages, setRecentMessages] = useState<AudioMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectedDevices: [],
    lastUpdate: new Date(),
  });

  useEffect(() => {
    // Initialize PTT service for group channel
    PTTService.setTargetDevice(null); // null = group channel

    // Load initial data
    updateDeviceList();
    updateConnectionStatus();

    // Set up event listeners
    const statusListener = DeviceEventEmitter.addListener(
      'connectionStatusChanged',
      handleConnectionStatusChange
    );

    const pttPressedListener = DeviceEventEmitter.addListener(
      'pttPressed',
      handlePTTPressed
    );

    const pttReleasedListener = DeviceEventEmitter.addListener(
      'pttReleased',
      handlePTTReleased
    );

    const audioMessageListener = DeviceEventEmitter.addListener(
      'audioMessageReceived',
      handleAudioMessageReceived
    );

    return () => {
      statusListener.remove();
      pttPressedListener.remove();
      pttReleasedListener.remove();
      audioMessageListener.remove();
    };
  }, []);

  const updateDeviceList = useCallback(() => {
    const devices = NetworkService.getConnectedDevices();
    setConnectedDevices(devices);
  }, []);

  const updateConnectionStatus = useCallback(() => {
    const status = NetworkService.getConnectionStatus();
    setConnectionStatus(status);
  }, []);

  const handleConnectionStatusChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    setConnectedDevices(status.connectedDevices);
  }, []);

  const handlePTTPressed = useCallback((_event: any) => {
    setIsPTTPressed(true);
    setIsRecording(true);
  }, []);

  const handlePTTReleased = useCallback((_event: any) => {
    setIsPTTPressed(false);
    setIsRecording(false);
  }, []);

  const handleAudioMessageReceived = useCallback(async (message: AudioMessage) => {
    if (message.isGroupMessage) {
      // Add to recent messages
      setRecentMessages(prev => [message, ...prev.slice(0, 9)]); // Keep last 10 messages

      // Add to active speakers
      const speaker: ActiveSpeaker = {
        deviceId: message.senderId,
        deviceName: message.senderName,
        startTime: message.timestamp,
      };

      setActiveSpeakers(prev => {
        const filtered = prev.filter(s => s.deviceId !== message.senderId);
        return [speaker, ...filtered];
      });

      // Play the audio
      await AudioService.playAudio(message.audioData);

      // Remove from active speakers after playback
      setTimeout(() => {
        setActiveSpeakers(prev => prev.filter(s => s.deviceId !== message.senderId));
      }, message.duration || 2000);
    }
  }, []);

  const handleSoftwarePTTPress = useCallback(async () => {
    await PTTService.startSoftwarePTT();
  }, []);

  const handleSoftwarePTTRelease = useCallback(async () => {
    await PTTService.stopSoftwarePTT();
  }, []);

  const renderDeviceItem = ({item}: {item: Device}) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <Icon
          name={item.deviceType === 'inrico_t320' ? 'radio' : 'smartphone'}
          size={20}
          color="#007AFF"
        />
        <Text style={styles.deviceName}>{item.name}</Text>
      </View>
      <View style={[
        styles.statusIndicator,
        {backgroundColor: item.isOnline ? '#4CAF50' : '#F44336'},
      ]} />
    </View>
  );

  const renderActiveSpeaker = ({item}: {item: ActiveSpeaker}) => (
    <View style={styles.activeSpeakerItem}>
      <Icon name="mic" size={16} color="#4CAF50" />
      <Text style={styles.activeSpeakerName}>{item.deviceName}</Text>
      <View style={styles.speakingIndicator}>
        <View style={[styles.speakingDot, styles.speakingDot1]} />
        <View style={[styles.speakingDot, styles.speakingDot2]} />
        <View style={[styles.speakingDot, styles.speakingDot3]} />
      </View>
    </View>
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  };

  return (
    <View style={styles.container}>
      {/* Header with connection status */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Group Channel</Text>
        <View style={styles.connectionInfo}>
          <View style={[
            styles.connectionDot,
            {backgroundColor: connectionStatus.isConnected ? '#4CAF50' : '#F44336'},
          ]} />
          <Text style={styles.connectionText}>
            {connectionStatus.isConnected
              ? `${connectionStatus.connectedDevices.length} devices`
              : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Active speakers */}
      {activeSpeakers.length > 0 && (
        <View style={styles.activeSpeakersSection}>
          <Text style={styles.sectionTitle}>Currently Speaking</Text>
          <FlatList
            data={activeSpeakers}
            renderItem={renderActiveSpeaker}
            keyExtractor={item => item.deviceId}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeSpeakersList}
          />
        </View>
      )}

      {/* Connected devices */}
      <View style={styles.devicesSection}>
        <Text style={styles.sectionTitle}>
          Connected Devices ({connectedDevices.length})
        </Text>
        <FlatList
          data={connectedDevices}
          renderItem={renderDeviceItem}
          keyExtractor={item => item.id}
          style={styles.devicesList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Recent messages */}
      <View style={styles.messagesSection}>
        <Text style={styles.sectionTitle}>Recent Messages</Text>
        <FlatList
          data={recentMessages.slice(0, 3)}
          renderItem={({item}) => (
            <View style={styles.messageItem}>
              <Text style={styles.messageSender}>{item.senderName}</Text>
              <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
            </View>
          )}
          keyExtractor={item => item.id}
          style={styles.messagesList}
        />
      </View>

      {/* PTT Button */}
      <View style={styles.pttContainer}>
        <TouchableOpacity
          style={[styles.pttButton, isPTTPressed && styles.pttButtonPressed]}
          onPressIn={handleSoftwarePTTPress}
          onPressOut={handleSoftwarePTTRelease}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isPTTPressed ? ['#FF6B6B', '#EE5A24'] : ['#007AFF', '#0056CC']}
            style={styles.pttGradient}
          >
            <Icon
              name={isRecording ? 'mic' : 'mic-none'}
              size={40}
              color="white"
            />
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <Text style={styles.recordingText}>REC</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.pttLabel}>
          {isPTTPressed ? 'Release to Send' : 'Hold to Talk'}
        </Text>
        <Text style={styles.pttSubLabel}>
          Broadcasting to all devices
        </Text>
      </View>

      {/* Instructions */}
      {connectedDevices.length === 0 && (
        <View style={styles.instructionsContainer}>
          <Icon name="wifi-tethering" size={48} color="#CCC" />
          <Text style={styles.instructionsTitle}>No Devices Connected</Text>
          <Text style={styles.instructionsText}>
            Make sure other devices are on the same WiFi network and have the app running.
          </Text>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 14,
    color: '#666',
  },
  activeSpeakersSection: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  activeSpeakersList: {
    maxHeight: 60,
  },
  activeSpeakerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeSpeakerName: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 4,
    marginRight: 8,
  },
  speakingIndicator: {
    flexDirection: 'row',
  },
  speakingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
    marginHorizontal: 1,
  },
  speakingDot1: {
    animationDelay: '0ms',
  },
  speakingDot2: {
    animationDelay: '200ms',
  },
  speakingDot3: {
    animationDelay: '400ms',
  },
  devicesSection: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
    flex: 1,
  },
  devicesList: {
    maxHeight: 200,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  messagesSection: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  messagesList: {
    maxHeight: 100,
  },
  messageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  messageSender: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  pttContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
  },
  pttButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pttButtonPressed: {
    elevation: 4,
    shadowOpacity: 0.2,
  },
  pttGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recordingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pttLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  pttSubLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default GroupChannelScreen;
