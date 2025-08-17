# Aquadroom Portofoon

A complete WiFi walkie-talkie application for work environments, designed for seamless communication between team members using Android devices and Inrico T320 radios.

## Features

### Core Communication
- **Group Channel**: Primary channel where ALL users can communicate together simultaneously
- **Individual Communications**: Direct device-to-device communication
- **Push-to-Talk (PTT)**: Hardware button integration for Inrico T320 devices
- **Real-time Audio**: Low-latency voice streaming over WiFi networks

### Audio System
- High-quality audio recording with noise cancellation
- Real-time audio streaming with multiple codec support (Opus, AAC)
- Audio playback with speaker management
- Volume controls and audio quality settings
- Optimized for voice communication with low latency (< 200ms)

### Networking
- Automatic WiFi device discovery and pairing
- Network stability with auto-reconnection handling
- Multi-device group communication management
- Connection status monitoring and indicators
- Robust UDP/TCP networking for audio transmission

### User Interface
- Main communication screen with PTT controls
- Group channel interface showing all connected users
- Individual chat/communication screens
- Settings and configuration pages
- Connection status and device management
- Audio level indicators and controls

### Hardware Support
- **Inrico T320**: Physical button mapping and hardware PTT integration
- **Android Devices**: Software PTT and touch controls
- Button hold/release detection for voice transmission
- Device-specific optimizations

### Channel Management
- Group channel creation and management
- User presence indicators (online, speaking, etc.)
- Channel switching between group and individual modes
- Audio mixing for simultaneous speakers in group channel

## Installation

### Prerequisites
- Node.js 18+ and npm
- Android SDK and development environment
- React Native development setup

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Mangamer21/Aquadroom-portofoon.git
   cd Aquadroom-portofoon
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. For Android development:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

### Running the Application

#### Development
```bash
# Start Metro bundler
npm start

# Run on Android device/emulator
npm run android

# Run on iOS device/simulator (if configured)
npm run ios
```

#### Production Build
```bash
# Build Android APK
npm run build
```

The built APK will be available in `android/app/build/outputs/apk/release/`

## Usage

### Initial Setup
1. Install the app on all devices that need to communicate
2. Ensure all devices are connected to the same WiFi network
3. Open the app on each device
4. Devices will automatically discover each other

### Group Communication
1. Open the app and navigate to the "Group Channel" tab
2. All connected devices will be visible in the device list
3. Hold the PTT button (on-screen or hardware) to talk
4. Release the button to stop recording and send the message
5. Audio messages are broadcast to all connected devices

### Individual Communication
1. Navigate to the "Devices" tab
2. Tap on a specific device from the list
3. Select "Start Individual Chat"
4. Use PTT to send private messages to that device only

### Settings Configuration
1. Navigate to the "Settings" tab
2. Configure user name and device settings
3. Adjust audio quality and volume levels
4. Enable/disable hardware PTT buttons
5. Test audio functionality

## Technical Architecture

### Components
- **React Native**: Cross-platform mobile framework
- **TypeScript**: Type-safe development
- **React Navigation**: Screen navigation and routing
- **Audio Services**: Custom audio recording and playback
- **Network Services**: WiFi discovery and communication
- **PTT Services**: Hardware button integration

### Services
- **AudioService**: Handles audio recording, playback, and codec management
- **NetworkService**: Manages device discovery and message transmission
- **PTTService**: Integrates hardware buttons and software PTT controls

### Audio Pipeline
1. Audio capture via device microphone
2. Noise reduction and audio processing
3. Codec encoding (Opus/AAC) for compression
4. Network transmission via UDP/TCP
5. Decoding and playback on receiving devices

### Network Protocol
- **Discovery**: UDP broadcast for device discovery
- **Audio**: Real-time audio packet transmission
- **Status**: Connection and presence management
- **Reliability**: Auto-reconnection and error handling

## Hardware Support

### Inrico T320 Integration
- Physical PTT button mapping (configurable key codes)
- Hardware volume controls
- Optimized audio settings for radio communication
- Device-specific audio processing

### Android Devices
- Software PTT controls
- Touch-based interface
- Standard Android audio APIs
- Permissions management

## Configuration

### Audio Settings
- **Input Volume**: Microphone sensitivity (0-100%)
- **Output Volume**: Speaker volume (0-100%)
- **Noise Reduction**: Background noise filtering
- **Audio Quality**: Low/Medium/High quality settings
- **Sample Rate**: 32kHz, 48kHz options
- **Bitrate**: 32kbps, 64kbps, 128kbps options

### PTT Settings
- **Hardware Button**: Enable/disable physical button PTT
- **Software Button**: Enable/disable on-screen PTT
- **Hold to Talk**: Continuous press mode
- **Key Code**: Configurable hardware button mapping

### Network Settings
- **Auto Connect**: Automatic device discovery
- **User Name**: Display name for other users
- **Device Name**: Device identifier

## Development

### Project Structure
```
src/
├── components/     # Reusable UI components
├── screens/        # Main application screens
├── services/       # Core business logic services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── hooks/          # Custom React hooks
```

### Key Files
- `src/App.tsx`: Main application component
- `src/services/AudioService.ts`: Audio recording and playback
- `src/services/NetworkService.ts`: Device discovery and communication
- `src/services/PTTService.ts`: Push-to-talk functionality
- `src/screens/GroupChannelScreen.tsx`: Group communication interface
- `src/screens/IndividualChatScreen.tsx`: Private messaging
- `src/screens/SettingsScreen.tsx`: Configuration interface

### Testing
```bash
# Run unit tests
npm test

# Run linting
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation and troubleshooting guide

## Changelog

### Version 1.0.0
- Initial release
- Group channel communication
- Individual device communication
- Hardware PTT support for Inrico T320
- Audio recording and playback
- WiFi device discovery
- Settings and configuration
- Real-time audio streaming