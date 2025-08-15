import React from 'react';
import {render} from '@testing-library/react-native';

// Mock all the dependencies
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-device-info', () => ({
  getUniqueId: () => Promise.resolve('test-device-id'),
  getDeviceName: () => Promise.resolve('Test Device'),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-audio-recorder-player', () => {
  return class MockAudioRecorderPlayer {
    setSubscriptionDuration() {}
    setAudioSessionConfiguration() {}
    startRecorder() { return Promise.resolve('test-path'); }
    stopRecorder() { return Promise.resolve('test-result'); }
    startPlayer() { return Promise.resolve('test-result'); }
    stopPlayer() { return Promise.resolve(); }
    addPlayBackListener() {}
    removePlayBackListener() {}
    removeRecordBackListener() {}
    setVolume() {}
  };
});

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children}: any) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    setOptions: jest.fn(),
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({children}: any) => children,
    Screen: ({children}: any) => children,
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({children}: any) => children,
    Screen: ({children}: any) => children,
  }),
}));

// Simple component test
describe('Basic Tests', () => {
  it('should import services without errors', () => {
    const {AudioService} = require('../src/services/AudioService');
    const {NetworkService} = require('../src/services/NetworkService');
    const {PTTService} = require('../src/services/PTTService');
    
    expect(AudioService).toBeDefined();
    expect(NetworkService).toBeDefined();
    expect(PTTService).toBeDefined();
  });
});