export interface Device {
  id: string;
  name: string;
  ipAddress: string;
  isOnline: boolean;
  lastSeen: Date;
  deviceType: 'android' | 'inrico_t320' | 'unknown';
}

export interface AudioMessage {
  id: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  duration: number;
  audioData: ArrayBuffer;
  isGroupMessage: boolean;
  targetDeviceId?: string;
}

export interface GroupChannel {
  id: string;
  name: string;
  members: Device[];
  isActive: boolean;
  createdAt: Date;
}

export interface ConnectionStatus {
  isConnected: boolean;
  wifiSSID?: string;
  ipAddress?: string;
  connectedDevices: Device[];
  lastUpdate: Date;
}

export interface AudioSettings {
  inputVolume: number;
  outputVolume: number;
  noiseReduction: boolean;
  audioCodec: 'opus' | 'aac' | 'pcm';
  sampleRate: number;
  bitrate: number;
}

export interface PTTSettings {
  hardwareButtonEnabled: boolean;
  softwareButtonEnabled: boolean;
  holdToTalkEnabled: boolean;
  pushToTalkKeyCode?: number;
}

export interface AppSettings {
  audio: AudioSettings;
  ptt: PTTSettings;
  autoConnect: boolean;
  userName: string;
  deviceName: string;
}

export interface NetworkPacket {
  type: 'discovery' | 'audio' | 'status' | 'join_group' | 'leave_group';
  senderId: string;
  senderName: string;
  timestamp: number;
  data: any;
}

export interface AudioStreamConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  codec: string;
  latency: number;
}
