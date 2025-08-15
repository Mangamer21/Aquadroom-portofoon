# Aquadroom Walkie-Talkie

A professional walkie-talkie application for work environments with Inrico T320 device support.

## Features

### 🔊 **WiFi Communication**
- Real-time voice communication over WiFi network
- WebRTC-based peer-to-peer audio streaming
- Low-latency communication optimized for work environments

### 📱 **Inrico T320 Device Support**
- Native support for Inrico T320 walkie-talkie devices
- Hardware PTT button integration
- Device-specific UI optimizations

### 🎤 **Push-to-Talk (PTT) Functionality**
- Hardware PTT button support for Inrico T320
- Space bar PTT for web/desktop users
- Visual PTT button for touch devices
- Real-time transmission status indicators

### 🖥️ **Simple Work-Optimized UI**
- Clean, intuitive interface designed for work environments
- Large, accessible controls for industrial use
- Connection status indicators
- Activity logging for communication tracking

### 🔧 **Audio Management**
- Audio recording, transmission, and playback
- Microphone and speaker volume controls
- Audio level monitoring with visual feedback
- Echo cancellation and noise suppression

### 🌐 **Network Discovery**
- Automatic device discovery on WiFi network
- Real-time user presence indicators
- Channel-based communication groups
- Connection status monitoring

## Quick Start

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Mangamer21/Aquadroom-portofoon.git
cd Aquadroom-portofoon
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Usage

1. **Join the Network**: Enter your name and select your device type
2. **Select a Channel**: Choose from General, Security, or Maintenance channels
3. **Configure Audio**: Adjust microphone and speaker volume
4. **Start Talking**: Use PTT button, Space key, or hardware PTT button

## Channels

The application includes pre-configured channels for different work groups:

- **General**: Main communication channel for general coordination
- **Security**: Dedicated channel for security personnel
- **Maintenance**: Channel for maintenance and technical teams

## Device Support

### Web Browsers
- Chrome, Firefox, Safari, Edge
- Space bar PTT functionality
- Full audio controls

### Inrico T320
- Hardware PTT button support
- Optimized UI for device screen
- Enhanced audio processing

### Mobile Devices
- Touch-friendly PTT controls
- Responsive design
- Mobile-optimized audio

## Technical Architecture

### Backend
- **Node.js** with Express for web server
- **Socket.IO** for real-time communication and signaling
- **WebRTC** signaling server for peer-to-peer connections

### Frontend
- **HTML5/CSS3/JavaScript** for cross-platform compatibility
- **WebRTC** for real-time audio communication
- **Socket.IO Client** for server communication
- **Responsive design** for multiple device types

### Audio
- **WebRTC** for low-latency peer-to-peer audio
- **Web Audio API** for audio processing and monitoring
- **Audio quality controls** with echo cancellation

## Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)

### Audio Settings
- Microphone volume control
- Speaker volume control
- Audio quality optimization for voice

## Development

### Running in Development Mode
```bash
npm run dev
```

### Project Structure
```
├── server.js              # Main server file
├── public/
│   ├── index.html         # Main web interface
│   ├── app.js            # Client-side application logic
│   └── styles.css        # UI styling
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Security Features

- Audio stream encryption via WebRTC
- Secure WebSocket connections
- Channel-based access control
- No audio data stored on server

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers with WebRTC support

## Hardware Requirements

### Minimum
- 2.4GHz WiFi connection
- Microphone and speakers/headphones
- 512MB RAM

### Recommended for Inrico T320
- 5GHz WiFi for better performance
- Dedicated PTT hardware button
- Noise-canceling microphone

## Troubleshooting

### Audio Issues
- Check microphone permissions in browser
- Test microphone using the "Test Microphone" button
- Adjust volume levels in audio settings

### Connection Issues
- Verify WiFi connection
- Check firewall settings for port 3000
- Ensure WebRTC is supported in browser

### PTT Issues
- For web users: Use Space bar or click PTT button
- For Inrico T320: Ensure hardware button mapping is correct
- Check device permissions for hardware access

## License

MIT License - see LICENSE file for details

## Support

For technical support or feature requests, please open an issue on GitHub.