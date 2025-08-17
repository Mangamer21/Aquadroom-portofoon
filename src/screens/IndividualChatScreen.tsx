import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {Device, AudioMessage} from '../types';
import {NetworkService} from '../services/NetworkService';
import {PTTService} from '../services/PTTService';
import {AudioService} from '../services/AudioService';

interface RouteParams {
  device: Device;
}

interface Props {
  route: {
    params: RouteParams;
  };
  navigation: any;
}

interface ChatMessage {
  id: string;
  type: 'sent' | 'received';
  timestamp: Date;
  duration: number;
  isPlaying?: boolean;
}

const IndividualChatScreen: React.FC<Props> = ({route, navigation}) => {
  const {device} = route.params;
  const [isPTTPressed, setIsPTTPressed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isDeviceOnline, setIsDeviceOnline] = useState(device.isOnline);

  useEffect(() => {
    // Set PTT target to this specific device
    PTTService.setTargetDevice(device.id);

    // Set up header
    navigation.setOptions({
      title: device.name,
      headerRight: () => (
        <View style={styles.headerRight}>
          <View style={[
            styles.headerStatusDot,
            {backgroundColor: isDeviceOnline ? '#4CAF50' : '#F44336'},
          ]} />
          <Text style={styles.headerStatusText}>
            {isDeviceOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      ),
    });

    // Set up event listeners
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

    const connectionStatusListener = DeviceEventEmitter.addListener(
      'connectionStatusChanged',
      handleConnectionStatusChange
    );

    return () => {
      // Reset PTT target when leaving
      PTTService.setTargetDevice(null);

      pttPressedListener.remove();
      pttReleasedListener.remove();
      audioMessageListener.remove();
      connectionStatusListener.remove();
    };
  }, [device, navigation, isDeviceOnline]);

  const handlePTTPressed = useCallback((event: any) => {
    if (event.targetDevice === device.id) {
      setIsPTTPressed(true);
      setIsRecording(true);
    }
  }, [device.id]);

  const handlePTTReleased = useCallback((event: any) => {
    setIsPTTPressed(false);
    setIsRecording(false);

    if (event.sent) {
      // Add sent message to chat
      const message: ChatMessage = {
        id: `sent_${Date.now()}`,
        type: 'sent',
        timestamp: new Date(),
        duration: event.duration || 0,
      };
      setChatMessages(prev => [message, ...prev]);
    }
  }, []);

  const handleAudioMessageReceived = useCallback((audioMessage: AudioMessage) => {
    // Only handle messages from this specific device
    if (audioMessage.senderId === device.id && !audioMessage.isGroupMessage) {
      const message: ChatMessage = {
        id: audioMessage.id,
        type: 'received',
        timestamp: audioMessage.timestamp,
        duration: audioMessage.duration,
      };

      setChatMessages(prev => [message, ...prev]);

      // Auto-play received messages
      AudioService.playAudio(audioMessage.audioData);
    }
  }, [device.id]);

  const handleConnectionStatusChange = useCallback((status: any) => {
    const updatedDevice = status.connectedDevices.find((d: Device) => d.id === device.id);
    setIsDeviceOnline(updatedDevice?.isOnline || false);
  }, [device.id]);

  const handleSoftwarePTTPress = useCallback(async () => {
    if (!isDeviceOnline) {
      Alert.alert('Device Offline', 'The target device is currently offline.');
      return;
    }
    await PTTService.startSoftwarePTT();
  }, [isDeviceOnline]);

  const handleSoftwarePTTRelease = useCallback(async () => {
    await PTTService.stopSoftwarePTT();
  }, []);

  const handlePlayMessage = useCallback(async (messageId: string) => {
    if (playingMessageId === messageId) {
      // Stop current playback
      await AudioService.stopPlayback();
      setPlayingMessageId(null);
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? {...msg, isPlaying: false} : msg
        )
      );
    } else {
      // Start playback
      setPlayingMessageId(messageId);
      setChatMessages(prev =>
        prev.map(msg => ({
          ...msg,
          isPlaying: msg.id === messageId,
        }))
      );

      // Note: In real implementation, you'd need to store the audio data
      // and play it here. For now, we'll just simulate playback.
      setTimeout(() => {
        setPlayingMessageId(null);
        setChatMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? {...msg, isPlaying: false} : msg
          )
        );
      }, 2000); // Simulate 2 second playback
    }
  }, [playingMessageId]);

  const formatDuration = (durationMs: number) => {
    const seconds = Math.floor(durationMs / 1000);
    return `${seconds}s`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  };

  const renderChatMessage = ({item}: {item: ChatMessage}) => (
    <View style={[
      styles.messageContainer,
      item.type === 'sent' ? styles.sentMessage : styles.receivedMessage,
    ]}>
      <TouchableOpacity
        style={[
          styles.messageContent,
          item.type === 'sent' ? styles.sentMessageContent : styles.receivedMessageContent,
        ]}
        onPress={() => handlePlayMessage(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.messageHeader}>
          <Icon
            name={item.isPlaying ? 'pause' : 'play-arrow'}
            size={20}
            color={item.type === 'sent' ? 'white' : '#007AFF'}
          />
          <Text style={[
            styles.messageDuration,
            {color: item.type === 'sent' ? 'white' : '#007AFF'},
          ]}>
            {formatDuration(item.duration)}
          </Text>
        </View>
        <Text style={[
          styles.messageTime,
          {color: item.type === 'sent' ? 'rgba(255,255,255,0.8)' : '#999'},
        ]}>
          {formatTime(item.timestamp)}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Device info header */}
      <View style={styles.deviceInfo}>
        <Icon
          name={device.deviceType === 'inrico_t320' ? 'radio' : 'smartphone'}
          size={24}
          color="#007AFF"
        />
        <View style={styles.deviceDetails}>
          <Text style={styles.deviceTypeText}>
            {device.deviceType === 'inrico_t320' ? 'Inrico T320 Radio' : 'Android Device'}
          </Text>
          <Text style={styles.deviceIPText}>{device.ipAddress}</Text>
        </View>
      </View>

      {/* Chat messages */}
      <FlatList
        data={chatMessages}
        renderItem={renderChatMessage}
        keyExtractor={item => item.id}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        inverted
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyChatContainer}>
            <Icon name="record-voice-over" size={48} color="#CCC" />
            <Text style={styles.emptyChatTitle}>No messages yet</Text>
            <Text style={styles.emptyChatSubtitle}>
              Hold the button below to send a voice message to {device.name}
            </Text>
          </View>
        )}
      />

      {/* PTT Button */}
      <View style={styles.pttContainer}>
        <TouchableOpacity
          style={[
            styles.pttButton,
            isPTTPressed && styles.pttButtonPressed,
            !isDeviceOnline && styles.pttButtonDisabled,
          ]}
          onPressIn={handleSoftwarePTTPress}
          onPressOut={handleSoftwarePTTRelease}
          activeOpacity={0.8}
          disabled={!isDeviceOnline}
        >
          <LinearGradient
            colors={
              !isDeviceOnline
                ? ['#CCC', '#999']
                : isPTTPressed
                  ? ['#FF6B6B', '#EE5A24']
                  : ['#007AFF', '#0056CC']
            }
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

        <Text style={[
          styles.pttLabel,
          !isDeviceOnline && styles.pttLabelDisabled,
        ]}>
          {!isDeviceOnline
            ? 'Device Offline'
            : isPTTPressed
              ? 'Release to Send'
              : 'Hold to Talk'
          }
        </Text>

        <Text style={styles.pttSubLabel}>
          Talking to {device.name}
        </Text>
      </View>

      {/* Connection warning */}
      {!isDeviceOnline && (
        <View style={styles.offlineWarning}>
          <Icon name="warning" size={20} color="#FF9800" />
          <Text style={styles.offlineWarningText}>
            Device is offline. Messages cannot be sent.
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  headerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerStatusText: {
    fontSize: 14,
    color: '#666',
  },
  deviceInfo: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  deviceDetails: {
    marginLeft: 12,
  },
  deviceTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceIPText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  sentMessage: {
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignItems: 'flex-start',
  },
  messageContent: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  sentMessageContent: {
    backgroundColor: '#007AFF',
  },
  receivedMessageContent: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageDuration: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  messageTime: {
    fontSize: 12,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyChatSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  pttContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  pttButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  pttButtonPressed: {
    elevation: 3,
    shadowOpacity: 0.2,
  },
  pttButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  pttGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF4444',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  pttLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  pttLabelDisabled: {
    color: '#999',
  },
  pttSubLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  offlineWarning: {
    backgroundColor: '#FFF3E0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  offlineWarningText: {
    fontSize: 14,
    color: '#F57C00',
    marginLeft: 8,
    flex: 1,
  },
});

export default IndividualChatScreen;
