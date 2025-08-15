import {NativeEventEmitter, DeviceEventEmitter} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Device, NetworkPacket, ConnectionStatus, AudioMessage} from '../types';

// Note: react-native-udp needs to be properly configured for this to work
// For now, we'll create a mock implementation that can be replaced with real UDP

class NetworkServiceClass {
  private devices: Map<string, Device> = new Map();
  private connectionStatus: ConnectionStatus;
  private eventEmitter: NativeEventEmitter | null = null;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private serverPort = 8888;
  private broadcastPort = 8889;
  private deviceId: string = '';
  private deviceName: string = '';
  private isInitialized = false;

  constructor() {
    this.connectionStatus = {
      isConnected: false,
      connectedDevices: [],
      lastUpdate: new Date(),
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Get device information
      this.deviceId = await DeviceInfo.getUniqueId();
      this.deviceName = await DeviceInfo.getDeviceName();

      // Try to get stored user name
      const storedUserName = await AsyncStorage.getItem('userName');
      if (storedUserName) {
        this.deviceName = storedUserName;
      }

      // Initialize network listeners
      await this.setupNetworkListeners();

      // Start device discovery
      this.startDeviceDiscovery();

      this.isInitialized = true;
      console.log('NetworkService initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize NetworkService:', error);
      return false;
    }
  }

  private async setupNetworkListeners(): Promise<void> {
    try {
      // In a real implementation, you would set up UDP listeners here
      // For now, we'll create a mock implementation

      console.log('Network listeners set up');
    } catch (error) {
      console.error('Failed to setup network listeners:', error);
    }
  }

  private startDeviceDiscovery(): void {
    // Send discovery broadcast every 5 seconds
    this.discoveryInterval = setInterval(() => {
      this.broadcastDiscovery();
    }, 5000);

    // Initial discovery
    this.broadcastDiscovery();
  }

  private async broadcastDiscovery(): Promise<void> {
    try {
      const discoveryPacket: NetworkPacket = {
        type: 'discovery',
        senderId: this.deviceId,
        senderName: this.deviceName,
        timestamp: Date.now(),
        data: {
          deviceType: 'android', // Could be detected automatically
          capabilities: ['audio', 'group_channel', 'individual_chat'],
        },
      };

      // In real implementation, broadcast this packet via UDP
      console.log('Broadcasting discovery packet:', discoveryPacket);

      // For demo purposes, simulate finding other devices
      this.simulateDeviceDiscovery();
    } catch (error) {
      console.error('Failed to broadcast discovery:', error);
    }
  }

  private simulateDeviceDiscovery(): void {
    // Simulate finding other devices for demo purposes
    const mockDevices: Device[] = [
      {
        id: 'device_001',
        name: 'Warehouse Scanner 1',
        ipAddress: '192.168.1.100',
        isOnline: true,
        lastSeen: new Date(),
        deviceType: 'inrico_t320',
      },
      {
        id: 'device_002',
        name: 'Mobile Worker 2',
        ipAddress: '192.168.1.101',
        isOnline: true,
        lastSeen: new Date(),
        deviceType: 'android',
      },
    ];

    mockDevices.forEach(device => {
      this.devices.set(device.id, device);
    });

    this.updateConnectionStatus();
  }

  async sendAudioMessage(audioData: ArrayBuffer, targetDeviceId?: string): Promise<boolean> {
    try {
      const audioMessage: AudioMessage = {
        id: `msg_${Date.now()}`,
        senderId: this.deviceId,
        senderName: this.deviceName,
        timestamp: new Date(),
        duration: 0, // Calculate from audioData
        audioData,
        isGroupMessage: !targetDeviceId,
        targetDeviceId,
      };

      const packet: NetworkPacket = {
        type: 'audio',
        senderId: this.deviceId,
        senderName: this.deviceName,
        timestamp: Date.now(),
        data: audioMessage,
      };

      if (targetDeviceId) {
        // Send to specific device
        return await this.sendToDevice(packet, targetDeviceId);
      } else {
        // Broadcast to all devices in group
        return await this.broadcastToGroup(packet);
      }
    } catch (error) {
      console.error('Failed to send audio message:', error);
      return false;
    }
  }

  private async sendToDevice(packet: NetworkPacket, deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isOnline) {
      console.log('Device not found or offline:', deviceId);
      return false;
    }

    try {
      // In real implementation, send packet to device.ipAddress
      console.log(`Sending packet to device ${deviceId} at ${device.ipAddress}:`, packet);
      return true;
    } catch (error) {
      console.error('Failed to send to device:', error);
      return false;
    }
  }

  private async broadcastToGroup(packet: NetworkPacket): Promise<boolean> {
    try {
      // Send to all online devices
      const onlineDevices = Array.from(this.devices.values()).filter(d => d.isOnline);

      console.log(`Broadcasting to ${onlineDevices.length} devices:`, packet);

      // In real implementation, send to each device or use multicast
      const results = await Promise.all(
        onlineDevices.map(device => this.sendToDevice(packet, device.id))
      );

      return results.some(result => result);
    } catch (error) {
      console.error('Failed to broadcast to group:', error);
      return false;
    }
  }

  getConnectedDevices(): Device[] {
    return Array.from(this.devices.values()).filter(device => device.isOnline);
  }

  getDeviceById(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  private updateConnectionStatus(): void {
    this.connectionStatus = {
      isConnected: this.devices.size > 0,
      connectedDevices: Array.from(this.devices.values()).filter(d => d.isOnline),
      lastUpdate: new Date(),
    };

    // Emit status update event
    DeviceEventEmitter.emit('connectionStatusChanged', this.connectionStatus);
  }

  async setUserName(userName: string): Promise<void> {
    this.deviceName = userName;
    await AsyncStorage.setItem('userName', userName);

    // Broadcast updated info
    this.broadcastDiscovery();
  }

  getUserName(): string {
    return this.deviceName;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  // Handle incoming packets (would be called by UDP listener)
  handleIncomingPacket(packet: NetworkPacket, senderIP: string): void {
    try {
      switch (packet.type) {
        case 'discovery':
          this.handleDiscoveryPacket(packet, senderIP);
          break;
        case 'audio':
          this.handleAudioPacket(packet);
          break;
        case 'status':
          this.handleStatusPacket(packet);
          break;
        default:
          console.log('Unknown packet type:', packet.type);
      }
    } catch (error) {
      console.error('Failed to handle incoming packet:', error);
    }
  }

  private handleDiscoveryPacket(packet: NetworkPacket, senderIP: string): void {
    const device: Device = {
      id: packet.senderId,
      name: packet.senderName,
      ipAddress: senderIP,
      isOnline: true,
      lastSeen: new Date(),
      deviceType: packet.data.deviceType || 'unknown',
    };

    this.devices.set(device.id, device);
    this.updateConnectionStatus();

    console.log('Discovered device:', device);
  }

  private handleAudioPacket(packet: NetworkPacket): void {
    const audioMessage: AudioMessage = packet.data;

    // Emit audio message event for the UI to handle
    DeviceEventEmitter.emit('audioMessageReceived', audioMessage);

    console.log('Received audio message from:', packet.senderName);
  }

  private handleStatusPacket(packet: NetworkPacket): void {
    // Handle status updates from other devices
    console.log('Received status update:', packet);
  }

  cleanup(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }

    // Close network connections
    this.devices.clear();
    this.isInitialized = false;

    console.log('NetworkService cleaned up');
  }
}

export const NetworkService = new NetworkServiceClass();
