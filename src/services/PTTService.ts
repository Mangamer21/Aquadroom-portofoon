import {NativeEventEmitter, DeviceEventEmitter} from 'react-native';
import {PTTSettings} from '../types';
import {AudioService} from './AudioService';
import {NetworkService} from './NetworkService';

class PTTServiceClass {
  private settings: PTTSettings;
  private eventEmitter: NativeEventEmitter | null = null;
  private isPressed = false;
  private isRecording = false;
  private recordingStartTime = 0;
  private currentTargetDevice: string | null = null; // null for group channel

  constructor() {
    this.settings = {
      hardwareButtonEnabled: true,
      softwareButtonEnabled: true,
      holdToTalkEnabled: true,
      pushToTalkKeyCode: 85, // Volume up key code for Inrico T320
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Set up hardware button listeners
      this.setupHardwareButtonListeners();

      // Set up key event listeners for Inrico T320
      this.setupKeyEventListeners();

      console.log('PTTService initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize PTTService:', error);
      return false;
    }
  }

  private setupHardwareButtonListeners(): void {
    // Listen for volume button events (common PTT mapping)
    DeviceEventEmitter.addListener('hardwareBackPress', this.handleHardwareButton.bind(this));
    DeviceEventEmitter.addListener('volumeButtonPressed', this.handleVolumeButton.bind(this));

    // Listen for custom PTT button events (Inrico T320 specific)
    DeviceEventEmitter.addListener('pttButtonPressed', this.handlePTTButtonPress.bind(this));
    DeviceEventEmitter.addListener('pttButtonReleased', this.handlePTTButtonRelease.bind(this));
  }

  private setupKeyEventListeners(): void {
    // For Inrico T320 devices, listen for specific key codes
    DeviceEventEmitter.addListener('keyDown', (event: {keyCode: number}) => {
      if (this.settings.hardwareButtonEnabled &&
          event.keyCode === this.settings.pushToTalkKeyCode) {
        this.handlePTTButtonPress();
      }
    });

    DeviceEventEmitter.addListener('keyUp', (event: {keyCode: number}) => {
      if (this.settings.hardwareButtonEnabled &&
          event.keyCode === this.settings.pushToTalkKeyCode) {
        this.handlePTTButtonRelease();
      }
    });
  }

  private handleHardwareButton(): boolean {
    if (!this.settings.hardwareButtonEnabled) {
      return false;
    }

    // Handle back button as PTT for testing
    if (!this.isPressed) {
      this.handlePTTButtonPress();
      return true; // Prevent default back action
    }

    return false;
  }

  private handleVolumeButton(event: {direction: 'up' | 'down'}): void {
    if (!this.settings.hardwareButtonEnabled) {
      return;
    }

    // Use volume up as PTT button
    if (event.direction === 'up') {
      if (!this.isPressed) {
        this.handlePTTButtonPress();
      }
    }
  }

  async handlePTTButtonPress(): Promise<void> {
    if (this.isPressed || this.isRecording) {
      return;
    }

    try {
      this.isPressed = true;
      this.recordingStartTime = Date.now();

      console.log('PTT button pressed - starting recording');

      // Start audio recording
      const recordingStarted = await AudioService.startRecording();

      if (recordingStarted) {
        this.isRecording = true;

        // Emit event for UI feedback
        DeviceEventEmitter.emit('pttPressed', {
          timestamp: this.recordingStartTime,
          targetDevice: this.currentTargetDevice,
        });

        // Provide haptic feedback
        this.provideHapticFeedback();
      } else {
        this.isPressed = false;
        console.error('Failed to start recording');
      }
    } catch (error) {
      console.error('Error handling PTT button press:', error);
      this.isPressed = false;
    }
  }

  async handlePTTButtonRelease(): Promise<void> {
    if (!this.isPressed || !this.isRecording) {
      return;
    }

    try {
      console.log('PTT button released - stopping recording');

      // Stop audio recording
      const audioData = await AudioService.stopRecording();

      this.isPressed = false;
      this.isRecording = false;

      if (audioData) {
        const recordingDuration = Date.now() - this.recordingStartTime;

        // Only send if recording is longer than minimum duration (e.g., 100ms)
        if (recordingDuration > 100) {
          // Send audio message via network
          const sent = await NetworkService.sendAudioMessage(
            audioData,
            this.currentTargetDevice
          );

          if (sent) {
            console.log('Audio message sent successfully');
          } else {
            console.error('Failed to send audio message');
          }
        } else {
          console.log('Recording too short, not sending');
        }
      }

      // Emit event for UI feedback
      DeviceEventEmitter.emit('pttReleased', {
        timestamp: Date.now(),
        duration: Date.now() - this.recordingStartTime,
        sent: !!audioData,
      });

    } catch (error) {
      console.error('Error handling PTT button release:', error);
      this.isPressed = false;
      this.isRecording = false;
    }
  }

  // Software PTT methods for on-screen button
  async startSoftwarePTT(): Promise<void> {
    if (!this.settings.softwareButtonEnabled) {
      return;
    }

    await this.handlePTTButtonPress();
  }

  async stopSoftwarePTT(): Promise<void> {
    if (!this.settings.softwareButtonEnabled) {
      return;
    }

    await this.handlePTTButtonRelease();
  }

  private provideHapticFeedback(): void {
    // Provide haptic feedback for better user experience
    // This would need react-native-haptic-feedback or similar package
    console.log('Providing haptic feedback for PTT press');
  }

  setTargetDevice(deviceId: string | null): void {
    this.currentTargetDevice = deviceId;
    console.log('PTT target device set to:', deviceId || 'group channel');
  }

  getCurrentTargetDevice(): string | null {
    return this.currentTargetDevice;
  }

  updateSettings(newSettings: Partial<PTTSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('PTT settings updated:', this.settings);
  }

  getSettings(): PTTSettings {
    return { ...this.settings };
  }

  isPTTPressed(): boolean {
    return this.isPressed;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  // Toggle between group channel and individual mode
  toggleCommunicationMode(): void {
    if (this.currentTargetDevice) {
      // Switch to group channel
      this.setTargetDevice(null);
      DeviceEventEmitter.emit('communicationModeChanged', {
        mode: 'group',
        target: null,
      });
    } else {
      // This would typically open a device selection UI
      DeviceEventEmitter.emit('showDeviceSelector', {});
    }
  }

  cleanup(): void {
    // Remove event listeners
    DeviceEventEmitter.removeAllListeners('hardwareBackPress');
    DeviceEventEmitter.removeAllListeners('volumeButtonPressed');
    DeviceEventEmitter.removeAllListeners('pttButtonPressed');
    DeviceEventEmitter.removeAllListeners('pttButtonReleased');
    DeviceEventEmitter.removeAllListeners('keyDown');
    DeviceEventEmitter.removeAllListeners('keyUp');

    // Stop any ongoing recording
    if (this.isRecording) {
      AudioService.stopRecording();
    }

    this.isPressed = false;
    this.isRecording = false;

    console.log('PTTService cleaned up');
  }
}

export const PTTService = new PTTServiceClass();
