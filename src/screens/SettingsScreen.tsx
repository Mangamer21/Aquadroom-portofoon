import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Alert,
  Slider,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AudioSettings, PTTSettings} from '../types';
import {NetworkService} from '../services/NetworkService';
import {AudioService} from '../services/AudioService';
import {PTTService} from '../services/PTTService';

const SettingsScreen: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    inputVolume: 1.0,
    outputVolume: 1.0,
    noiseReduction: true,
    audioCodec: 'opus',
    sampleRate: 48000,
    bitrate: 64000,
  });
  const [pttSettings, setPttSettings] = useState<PTTSettings>({
    hardwareButtonEnabled: true,
    softwareButtonEnabled: true,
    holdToTalkEnabled: true,
    pushToTalkKeyCode: 85,
  });
  const [autoConnect, setAutoConnect] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);

      // Load settings from storage
      const [
        storedUserName,
        storedAutoConnect,
        storedAudioSettings,
        storedPTTSettings,
      ] = await Promise.all([
        AsyncStorage.getItem('userName'),
        AsyncStorage.getItem('autoConnect'),
        AsyncStorage.getItem('audioSettings'),
        AsyncStorage.getItem('pttSettings'),
      ]);

      if (storedUserName) {setUserName(storedUserName);}
      if (storedAutoConnect) {setAutoConnect(JSON.parse(storedAutoConnect));}
      if (storedAudioSettings) {setAudioSettings(JSON.parse(storedAudioSettings));}
      if (storedPTTSettings) {setPttSettings(JSON.parse(storedPTTSettings));}

      // Load current service settings
      const currentAudioSettings = AudioService.getSettings();
      const currentPTTSettings = PTTService.getSettings();
      const currentUserName = NetworkService.getUserName();

      setAudioSettings(currentAudioSettings);
      setPttSettings(currentPTTSettings);
      if (currentUserName) {setUserName(currentUserName);}

    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserName = useCallback(async () => {
    if (userName.trim().length === 0) {
      Alert.alert('Error', 'Please enter a valid user name');
      return;
    }

    try {
      await AsyncStorage.setItem('userName', userName.trim());
      await NetworkService.setUserName(userName.trim());
      Alert.alert('Success', 'User name updated successfully');
    } catch (error) {
      console.error('Failed to save user name:', error);
      Alert.alert('Error', 'Failed to save user name');
    }
  }, [userName]);

  const updateAudioSettings = useCallback(async (newSettings: Partial<AudioSettings>) => {
    const updatedSettings = { ...audioSettings, ...newSettings };
    setAudioSettings(updatedSettings);

    try {
      AudioService.updateSettings(updatedSettings);
      await AsyncStorage.setItem('audioSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to update audio settings:', error);
    }
  }, [audioSettings]);

  const updatePTTSettings = useCallback(async (newSettings: Partial<PTTSettings>) => {
    const updatedSettings = { ...pttSettings, ...newSettings };
    setPttSettings(updatedSettings);

    try {
      PTTService.updateSettings(updatedSettings);
      await AsyncStorage.setItem('pttSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to update PTT settings:', error);
    }
  }, [pttSettings]);

  const testAudio = useCallback(async () => {
    try {
      Alert.alert(
        'Audio Test',
        'This will record 3 seconds of audio and play it back.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Test',
            onPress: async () => {
              const started = await AudioService.startRecording();
              if (started) {
                setTimeout(async () => {
                  const audioData = await AudioService.stopRecording();
                  if (audioData) {
                    setTimeout(() => {
                      AudioService.playAudio(audioData);
                    }, 500);
                  }
                }, 3000);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Audio test failed:', error);
      Alert.alert('Error', 'Audio test failed');
    }
  }, []);

  const resetSettings = useCallback(() => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'audioSettings',
                'pttSettings',
                'autoConnect',
              ]);

              // Reset to defaults
              const defaultAudio: AudioSettings = {
                inputVolume: 1.0,
                outputVolume: 1.0,
                noiseReduction: true,
                audioCodec: 'opus',
                sampleRate: 48000,
                bitrate: 64000,
              };

              const defaultPTT: PTTSettings = {
                hardwareButtonEnabled: true,
                softwareButtonEnabled: true,
                holdToTalkEnabled: true,
                pushToTalkKeyCode: 85,
              };

              setAudioSettings(defaultAudio);
              setPttSettings(defaultPTT);
              setAutoConnect(true);

              AudioService.updateSettings(defaultAudio);
              PTTService.updateSettings(defaultPTT);

              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error) {
              console.error('Failed to reset settings:', error);
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  }, []);

  const SettingItem: React.FC<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }> = ({title, subtitle, children}) => (
    <View style={styles.settingItem}>
      <View style={styles.settingHeader}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingControl}>
        {children}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Settings</Text>

        <SettingItem title="User Name" subtitle="Name displayed to other users">
          <View style={styles.userNameContainer}>
            <TextInput
              style={styles.textInput}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveUserName}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </SettingItem>

        <SettingItem title="Auto Connect" subtitle="Automatically connect to known devices">
          <Switch
            value={autoConnect}
            onValueChange={(value) => {
              setAutoConnect(value);
              AsyncStorage.setItem('autoConnect', JSON.stringify(value));
            }}
            trackColor={{false: '#E0E0E0', true: '#007AFF40'}}
            thumbColor={autoConnect ? '#007AFF' : '#999'}
          />
        </SettingItem>
      </View>

      {/* Audio Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Settings</Text>

        <SettingItem title="Input Volume" subtitle="Microphone sensitivity">
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              value={audioSettings.inputVolume}
              onValueChange={(value) => updateAudioSettings({inputVolume: value})}
              minimumValue={0}
              maximumValue={1}
              step={0.1}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E0E0E0"
              thumbStyle={styles.sliderThumb}
            />
            <Text style={styles.sliderValue}>
              {Math.round(audioSettings.inputVolume * 100)}%
            </Text>
          </View>
        </SettingItem>

        <SettingItem title="Output Volume" subtitle="Speaker volume">
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              value={audioSettings.outputVolume}
              onValueChange={(value) => updateAudioSettings({outputVolume: value})}
              minimumValue={0}
              maximumValue={1}
              step={0.1}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E0E0E0"
              thumbStyle={styles.sliderThumb}
            />
            <Text style={styles.sliderValue}>
              {Math.round(audioSettings.outputVolume * 100)}%
            </Text>
          </View>
        </SettingItem>

        <SettingItem title="Noise Reduction" subtitle="Reduce background noise">
          <Switch
            value={audioSettings.noiseReduction}
            onValueChange={(value) => updateAudioSettings({noiseReduction: value})}
            trackColor={{false: '#E0E0E0', true: '#007AFF40'}}
            thumbColor={audioSettings.noiseReduction ? '#007AFF' : '#999'}
          />
        </SettingItem>

        <SettingItem title="Audio Quality" subtitle="Higher quality uses more bandwidth">
          <View style={styles.qualityContainer}>
            <TouchableOpacity
              style={[
                styles.qualityButton,
                audioSettings.bitrate === 32000 && styles.qualityButtonActive,
              ]}
              onPress={() => updateAudioSettings({bitrate: 32000, sampleRate: 32000})}
            >
              <Text style={[
                styles.qualityButtonText,
                audioSettings.bitrate === 32000 && styles.qualityButtonTextActive,
              ]}>Low</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.qualityButton,
                audioSettings.bitrate === 64000 && styles.qualityButtonActive,
              ]}
              onPress={() => updateAudioSettings({bitrate: 64000, sampleRate: 48000})}
            >
              <Text style={[
                styles.qualityButtonText,
                audioSettings.bitrate === 64000 && styles.qualityButtonTextActive,
              ]}>Medium</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.qualityButton,
                audioSettings.bitrate === 128000 && styles.qualityButtonActive,
              ]}
              onPress={() => updateAudioSettings({bitrate: 128000, sampleRate: 48000})}
            >
              <Text style={[
                styles.qualityButtonText,
                audioSettings.bitrate === 128000 && styles.qualityButtonTextActive,
              ]}>High</Text>
            </TouchableOpacity>
          </View>
        </SettingItem>

        <TouchableOpacity style={styles.testButton} onPress={testAudio}>
          <Icon name="mic" size={20} color="#007AFF" />
          <Text style={styles.testButtonText}>Test Audio</Text>
        </TouchableOpacity>
      </View>

      {/* PTT Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push-to-Talk Settings</Text>

        <SettingItem title="Hardware Button" subtitle="Use physical button for PTT">
          <Switch
            value={pttSettings.hardwareButtonEnabled}
            onValueChange={(value) => updatePTTSettings({hardwareButtonEnabled: value})}
            trackColor={{false: '#E0E0E0', true: '#007AFF40'}}
            thumbColor={pttSettings.hardwareButtonEnabled ? '#007AFF' : '#999'}
          />
        </SettingItem>

        <SettingItem title="Software Button" subtitle="Use on-screen button for PTT">
          <Switch
            value={pttSettings.softwareButtonEnabled}
            onValueChange={(value) => updatePTTSettings({softwareButtonEnabled: value})}
            trackColor={{false: '#E0E0E0', true: '#007AFF40'}}
            thumbColor={pttSettings.softwareButtonEnabled ? '#007AFF' : '#999'}
          />
        </SettingItem>

        <SettingItem title="Hold to Talk" subtitle="Keep button pressed while talking">
          <Switch
            value={pttSettings.holdToTalkEnabled}
            onValueChange={(value) => updatePTTSettings({holdToTalkEnabled: value})}
            trackColor={{false: '#E0E0E0', true: '#007AFF40'}}
            thumbColor={pttSettings.holdToTalkEnabled ? '#007AFF' : '#999'}
          />
        </SettingItem>
      </View>

      {/* Device Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Information</Text>

        <SettingItem title="Device ID" subtitle={NetworkService.getDeviceId()}>
          <></>
        </SettingItem>

        <SettingItem title="Network Status" subtitle="WiFi connection status">
          <Icon
            name="wifi"
            size={24}
            color="#4CAF50"
          />
        </SettingItem>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
          <Icon name="restore" size={20} color="#F44336" />
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Aquadroom Portofoon v1.0.0</Text>
        <Text style={styles.footerSubtext}>WiFi Walkie-Talkie for Work Environments</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingHeader: {
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
  },
  sliderValue: {
    fontSize: 14,
    color: '#333',
    minWidth: 40,
    textAlign: 'right',
  },
  qualityContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  qualityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: 6,
  },
  qualityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  qualityButtonText: {
    fontSize: 14,
    color: '#666',
  },
  qualityButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default SettingsScreen;
