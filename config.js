// Configuration file for Aquadroom Walkie-Talkie
const config = {
    // Server settings
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },

    // Audio settings
    audio: {
        sampleRate: 44100,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        defaultMicVolume: 80,
        defaultSpeakerVolume: 80
    },

    // WebRTC settings
    webrtc: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    },

    // Device-specific settings
    devices: {
        'inrico-t320': {
            // Hardware button mapping
            pttButtonIndex: 0,
            volumeUpButtonIndex: 1,
            volumeDownButtonIndex: 2,
            
            // Audio optimization
            audioSettings: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false // Inrico handles this
            },
            
            // UI optimization
            ui: {
                largePTTButton: true,
                highContrastMode: true,
                reducedAnimations: true
            }
        },
        
        'web': {
            // Keyboard shortcuts
            pttKey: 'Space',
            muteKey: 'KeyM',
            
            // UI settings
            ui: {
                showKeyboardHints: true,
                animationsEnabled: true
            }
        },
        
        'mobile': {
            // Touch optimizations
            ui: {
                largeTouchTargets: true,
                reducedAnimations: true,
                hapticFeedback: true
            }
        }
    },

    // Channel settings
    channels: {
        maxUsers: 50,
        defaultChannels: [
            { id: 'general', name: 'General', description: 'Main communication channel' },
            { id: 'security', name: 'Security', description: 'Security personnel channel' },
            { id: 'maintenance', name: 'Maintenance', description: 'Maintenance and technical teams' }
        ]
    },

    // Logging settings
    logging: {
        maxLogEntries: 50,
        logLevel: 'info'
    }
};

module.exports = config;