import {NativeEventEmitter, PermissionsAndroid, Platform} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {AudioSettings, AudioStreamConfig} from '../types';

class AudioServiceClass {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private eventEmitter: NativeEventEmitter | null = null;
  private isRecording = false;
  private isPlaying = false;
  private settings: AudioSettings;
  private recordingPath = '';

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.settings = {
      inputVolume: 1.0,
      outputVolume: 1.0,
      noiseReduction: true,
      audioCodec: 'opus',
      sampleRate: 48000,
      bitrate: 64000,
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Request audio permissions
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        const allPermissionsGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED,
        );

        if (!allPermissionsGranted) {
          console.error('Audio permissions not granted');
          return false;
        }
      }

      // Configure audio session
      await this.configureAudioSession();

      console.log('AudioService initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize AudioService:', error);
      return false;
    }
  }

  private async configureAudioSession(): Promise<void> {
    try {
      // Set audio mode for voice communication
      this.audioRecorderPlayer.setSubscriptionDuration(0.1); // 100ms intervals

      // Configure for low latency and voice optimization
      const audioSet = {
        AudioSourceAndroid: 7, // VOICE_COMMUNICATION
        OutputFormatAndroid: 2, // THREE_GPP
        AudioEncoderAndroid: 1, // AMR_NB
        AudioSamplingRateAndroid: this.settings.sampleRate,
        AudioChannelsAndroid: 1, // Mono for voice
        AudioEncodingBitRateAndroid: this.settings.bitrate,
      };

      this.audioRecorderPlayer.setAudioSessionConfiguration(audioSet);
    } catch (error) {
      console.error('Failed to configure audio session:', error);
    }
  }

  async startRecording(): Promise<boolean> {
    if (this.isRecording) {
      return false;
    }

    try {
      this.recordingPath = `audio_${Date.now()}.m4a`;

      const audioSet = {
        AudioEncoderAndroid: 3, // AAC
        AudioSourceAndroid: 7, // VOICE_COMMUNICATION
        AudioSamplingRateAndroid: this.settings.sampleRate,
        AudioChannelsAndroid: 1,
        AudioEncodingBitRateAndroid: this.settings.bitrate,
        OutputFormatAndroid: 2,
      };

      const result = await this.audioRecorderPlayer.startRecorder(
        this.recordingPath,
        audioSet,
      );

      if (result) {
        this.isRecording = true;
        console.log('Recording started:', result);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<ArrayBuffer | null> {
    if (!this.isRecording) {
      return null;
    }

    try {
      const result = await this.audioRecorderPlayer.stopRecorder();
      this.isRecording = false;

      // Read the recorded file as ArrayBuffer
      // This is a simplified version - in real implementation,
      // you'd need to read the file and convert to ArrayBuffer
      console.log('Recording stopped:', result);

      // For now, return a mock ArrayBuffer
      // In real implementation, read the file and return its content
      return new ArrayBuffer(1024); // Mock data
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }

  async playAudio(_audioData: ArrayBuffer): Promise<boolean> {
    if (this.isPlaying) {
      await this.stopPlayback();
    }

    try {
      // In real implementation, you'd write the ArrayBuffer to a temporary file
      // and then play it. For now, we'll use a simplified approach.

      const tempPath = `temp_audio_${Date.now()}.m4a`;
      // Write audioData to tempPath (implementation needed)

      const result = await this.audioRecorderPlayer.startPlayer(tempPath);

      if (result) {
        this.isPlaying = true;
        console.log('Audio playback started:', result);

        // Listen for playback completion
        this.audioRecorderPlayer.addPlayBackListener((e) => {
          if (e.currentPosition === e.duration) {
            this.isPlaying = false;
          }
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to play audio:', error);
      return false;
    }
  }

  async stopPlayback(): Promise<void> {
    if (!this.isPlaying) {
      return;
    }

    try {
      await this.audioRecorderPlayer.stopPlayer();
      this.isPlaying = false;
      console.log('Audio playback stopped');
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  }

  setVolume(volume: number): void {
    this.settings.outputVolume = Math.max(0, Math.min(1, volume));
    this.audioRecorderPlayer.setVolume(this.settings.outputVolume);
  }

  getVolume(): number {
    return this.settings.outputVolume;
  }

  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    // Apply new settings
    this.configureAudioSession();
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  getStreamConfig(): AudioStreamConfig {
    return {
      sampleRate: this.settings.sampleRate,
      channels: 1, // Mono for voice
      bitsPerSample: 16,
      codec: this.settings.audioCodec,
      latency: 100, // Target 100ms latency
    };
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  cleanup(): void {
    if (this.isRecording) {
      this.stopRecording();
    }
    if (this.isPlaying) {
      this.stopPlayback();
    }

    this.audioRecorderPlayer.removePlayBackListener();
    this.audioRecorderPlayer.removeRecordBackListener();
  }
}

export const AudioService = new AudioServiceClass();
