class WalkieTalkieApp {
    constructor() {
        this.socket = null;
        this.localStream = null;
        this.remoteAudio = null;
        this.peerConnections = new Map();
        this.isTransmitting = false;
        this.isPTTPressed = false;
        this.currentChannel = null;
        this.username = null;
        this.deviceType = 'web';
        this.micAnalyser = null;
        this.micLevel = 0;
        this.inricoIntegration = null;
        
        this.initializeApp();
    }

    initializeApp() {
        this.connectSocket();
        this.setupEventListeners();
        this.setupPTTControls();
        this.setupAudioContext();
    }

    connectSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.updateConnectionStatus('online', 'Connected');
            this.addLogEntry('Connected to server', 'success');
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus('offline', 'Disconnected');
            this.addLogEntry('Disconnected from server', 'error');
        });

        this.socket.on('user-update', (data) => {
            this.updateUsersList(data.users);
        });

        this.socket.on('channel-update', (data) => {
            this.updateChannelsList(data.channels);
        });

        this.socket.on('user-joined-channel', (data) => {
            this.addLogEntry(`${data.username} joined ${data.channel}`, 'system');
        });

        this.socket.on('user-left-channel', (data) => {
            this.addLogEntry(`${data.username} left ${data.channel}`, 'system');
        });

        this.socket.on('transmission-start', (data) => {
            this.handleTransmissionStart(data);
        });

        this.socket.on('transmission-stop', (data) => {
            this.handleTransmissionStop(data);
        });

        this.socket.on('audio-stream', (data) => {
            this.handleAudioStream(data);
        });

        // WebRTC signaling
        this.socket.on('webrtc-offer', (data) => {
            this.handleWebRTCOffer(data);
        });

        this.socket.on('webrtc-answer', (data) => {
            this.handleWebRTCAnswer(data);
        });

        this.socket.on('webrtc-ice-candidate', (data) => {
            this.handleWebRTCIceCandidate(data);
        });
    }

    setupEventListeners() {
        // Registration form
        document.getElementById('joinBtn').addEventListener('click', () => {
            this.registerUser();
        });

        // Enter key on username input
        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.registerUser();
            }
        });

        // Audio controls
        document.getElementById('micVolume').addEventListener('input', (e) => {
            document.getElementById('micVolumeValue').textContent = e.target.value + '%';
            this.updateMicrophoneGain(e.target.value / 100);
        });

        document.getElementById('speakerVolume').addEventListener('input', (e) => {
            document.getElementById('speakerVolumeValue').textContent = e.target.value + '%';
            this.updateSpeakerVolume(e.target.value / 100);
        });

        document.getElementById('testMicBtn').addEventListener('click', () => {
            this.testMicrophone();
        });

        // Device type change
        document.getElementById('deviceTypeSelect').addEventListener('change', (e) => {
            this.deviceType = e.target.value;
            this.updateDeviceSpecificUI();
        });
    }

    setupPTTControls() {
        const pttButton = document.getElementById('pttButton');
        
        // Mouse/touch events for PTT button
        pttButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startPTT();
        });

        pttButton.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.stopPTT();
        });

        pttButton.addEventListener('mouseleave', (e) => {
            this.stopPTT();
        });

        pttButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startPTT();
        });

        pttButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopPTT();
        });

        // Keyboard controls (Space key for PTT)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isPTTPressed && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                this.startPTT();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.stopPTT();
            }
        });

        // Inrico T320 hardware button simulation (can be mapped to actual hardware events)
        this.setupInricoT320Support();
    }

    setupInricoT320Support() {
        // Check if running on Inrico T320 device
        if (this.deviceType === 'inrico-t320') {
            document.body.classList.add('inrico-mode');
            
            // Try to detect hardware PTT button (if browser supports it)
            if ('navigator' in window && 'getGamepads' in navigator) {
                this.pollForHardwareButtons();
            }

            // Add specific event listeners for Inrico T320 if available
            this.addLogEntry('Inrico T320 mode activated', 'system');
        }
    }

    pollForHardwareButtons() {
        setInterval(() => {
            const gamepads = navigator.getGamepads();
            for (let gamepad of gamepads) {
                if (gamepad && gamepad.buttons) {
                    // Check for PTT button press (button 0 typically)
                    if (gamepad.buttons[0] && gamepad.buttons[0].pressed && !this.isPTTPressed) {
                        this.startPTT();
                    } else if ((!gamepad.buttons[0] || !gamepad.buttons[0].pressed) && this.isPTTPressed) {
                        this.stopPTT();
                    }
                }
            }
        }, 50); // Poll every 50ms for responsive button detection
    }

    async setupAudioContext() {
        try {
            // Setup remote audio element
            this.remoteAudio = document.getElementById('remoteAudio');
            
            // Request microphone access
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                } 
            });

            // Setup microphone level monitoring
            this.setupMicrophoneLevelMonitoring();
            
            this.addLogEntry('Audio system initialized', 'success');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.addLogEntry('Failed to access microphone', 'error');
        }
    }

    setupMicrophoneLevelMonitoring() {
        if (!this.localStream) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(this.localStream);
        this.micAnalyser = audioContext.createAnalyser();
        this.micAnalyser.fftSize = 256;
        
        source.connect(this.micAnalyser);

        const updateMicLevel = () => {
            if (this.micAnalyser) {
                const dataArray = new Uint8Array(this.micAnalyser.frequencyBinCount);
                this.micAnalyser.getByteFrequencyData(dataArray);
                
                const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
                this.micLevel = (average / 255) * 100;
                
                const micLevelBar = document.querySelector('.mic-level-bar');
                if (micLevelBar) {
                    micLevelBar.style.width = this.micLevel + '%';
                }
            }
            requestAnimationFrame(updateMicLevel);
        };
        
        updateMicLevel();
    }

    registerUser() {
        const usernameInput = document.getElementById('usernameInput');
        const deviceTypeSelect = document.getElementById('deviceTypeSelect');
        
        const username = usernameInput.value.trim();
        if (!username) {
            alert('Please enter your name');
            return;
        }

        this.username = username;
        this.deviceType = deviceTypeSelect.value;

        this.socket.emit('register', {
            username: this.username,
            deviceType: this.deviceType
        });

        // Hide registration, show main interface
        document.getElementById('registrationSection').style.display = 'none';
        document.getElementById('mainInterface').style.display = 'block';

        this.updateDeviceSpecificUI();
        this.loadChannels();
        this.addLogEntry(`Welcome, ${this.username}!`, 'success');
    }

    updateDeviceSpecificUI() {
        if (this.deviceType === 'inrico-t320') {
            this.setupInricoT320Support();
            
            // Initialize Inrico integration if available
            if (typeof InricoT320Integration !== 'undefined') {
                this.inricoIntegration = new InricoT320Integration(this);
            }
        }
    }

    async loadChannels() {
        try {
            const response = await fetch('/api/channels');
            const channels = await response.json();
            this.updateChannelsList(channels);
        } catch (error) {
            console.error('Error loading channels:', error);
            this.addLogEntry('Failed to load channels', 'error');
        }
    }

    updateChannelsList(channels) {
        const channelsList = document.getElementById('channelsList');
        channelsList.innerHTML = '';

        channels.forEach(channel => {
            const channelElement = document.createElement('div');
            channelElement.className = 'channel-item';
            channelElement.innerHTML = `
                <span class="channel-name">${channel.name}</span>
                <span class="channel-users">${channel.userCount} users</span>
            `;
            
            channelElement.addEventListener('click', () => {
                this.joinChannel(channel.id);
            });

            if (channel.id === this.currentChannel) {
                channelElement.classList.add('active');
            }

            channelsList.appendChild(channelElement);
        });
    }

    joinChannel(channelId) {
        this.currentChannel = channelId;
        this.socket.emit('join-channel', channelId);
        
        // Update UI
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
        });
        
        event.target.closest('.channel-item').classList.add('active');
        
        this.addLogEntry(`Joined channel: ${channelId}`, 'system');
    }

    startPTT() {
        if (this.isPTTPressed || !this.localStream || !this.currentChannel) return;

        this.isPTTPressed = true;
        this.isTransmitting = true;

        // Update UI
        const pttButton = document.getElementById('pttButton');
        pttButton.classList.add('active');
        pttButton.querySelector('.ptt-text').textContent = 'Transmitting...';

        const transmissionStatus = document.getElementById('transmissionStatus');
        transmissionStatus.querySelector('.transmission-indicator').classList.add('transmitting');
        transmissionStatus.querySelector('.transmission-text').textContent = 'Transmitting';

        // Start transmission
        this.socket.emit('ptt-start');
        this.startAudioTransmission();

        this.addLogEntry('Started transmission', 'system');
    }

    stopPTT() {
        if (!this.isPTTPressed) return;

        this.isPTTPressed = false;
        this.isTransmitting = false;

        // Update UI
        const pttButton = document.getElementById('pttButton');
        pttButton.classList.remove('active');
        pttButton.querySelector('.ptt-text').textContent = 'Hold to Talk';

        const transmissionStatus = document.getElementById('transmissionStatus');
        transmissionStatus.querySelector('.transmission-indicator').classList.remove('transmitting');
        transmissionStatus.querySelector('.transmission-text').textContent = 'Ready';

        // Stop transmission
        this.socket.emit('ptt-stop');
        this.stopAudioTransmission();

        this.addLogEntry('Stopped transmission', 'system');
    }

    startAudioTransmission() {
        if (!this.localStream) return;

        // For now, we'll simulate audio transmission
        // In a production environment, this would involve WebRTC or direct audio streaming
        this.transmissionInterval = setInterval(() => {
            if (this.isTransmitting) {
                // Simulate sending audio data
                const audioData = this.captureAudioData();
                if (audioData) {
                    this.socket.emit('audio-stream', audioData);
                }
            }
        }, 100); // Send audio data every 100ms
    }

    stopAudioTransmission() {
        if (this.transmissionInterval) {
            clearInterval(this.transmissionInterval);
            this.transmissionInterval = null;
        }
    }

    captureAudioData() {
        // This is a simplified audio capture simulation
        // In production, you would use AudioWorklet or ScriptProcessorNode
        if (this.micAnalyser) {
            const dataArray = new Uint8Array(this.micAnalyser.frequencyBinCount);
            this.micAnalyser.getByteFrequencyData(dataArray);
            return Array.from(dataArray);
        }
        return null;
    }

    handleTransmissionStart(data) {
        this.addLogEntry(`${data.username} is transmitting`, 'system');
        this.updateUserTransmissionStatus(data.senderId, true);
    }

    handleTransmissionStop(data) {
        this.addLogEntry(`${data.username} stopped transmitting`, 'system');
        this.updateUserTransmissionStatus(data.senderId, false);
    }

    handleAudioStream(data) {
        // Handle incoming audio stream
        // In production, this would decode and play the audio
        console.log('Received audio stream from:', data.username);
        // For now, we'll just log it
    }

    updateUserTransmissionStatus(userId, isTransmitting) {
        const userElements = document.querySelectorAll('.user-item');
        userElements.forEach(element => {
            if (element.dataset.userId === userId) {
                const statusIndicator = element.querySelector('.user-status');
                if (statusIndicator) {
                    statusIndicator.classList.toggle('transmitting', isTransmitting);
                }
            }
        });
    }

    updateUsersList(users) {
        const usersList = document.getElementById('usersList');
        
        if (users.length === 0) {
            usersList.innerHTML = '<p class="no-users">No other users in current channel</p>';
            return;
        }

        usersList.innerHTML = '';
        users.forEach(user => {
            if (user.username !== this.username) {
                const userElement = document.createElement('div');
                userElement.className = 'user-item';
                userElement.dataset.userId = user.id;
                userElement.innerHTML = `
                    <div>
                        <div class="user-name">${user.username}</div>
                        <div class="user-device">${user.deviceType || 'web'}</div>
                    </div>
                    <div class="user-status"></div>
                `;
                usersList.appendChild(userElement);
            }
        });
    }

    updateConnectionStatus(status, text) {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        statusIndicator.className = `status-indicator ${status}`;
        statusText.textContent = text;
    }

    updateMicrophoneGain(gain) {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            audioTracks.forEach(track => {
                const constraints = track.getConstraints();
                track.applyConstraints({
                    ...constraints,
                    volume: gain
                });
            });
        }
    }

    updateSpeakerVolume(volume) {
        if (this.remoteAudio) {
            this.remoteAudio.volume = volume;
        }
    }

    testMicrophone() {
        if (!this.localStream) {
            this.addLogEntry('Microphone not available', 'error');
            return;
        }

        this.addLogEntry('Testing microphone... Speak now!', 'system');
        
        // Flash the mic level for visual feedback
        const micLevelBar = document.querySelector('.mic-level-bar');
        if (micLevelBar) {
            let flashCount = 0;
            const flashInterval = setInterval(() => {
                micLevelBar.style.background = flashCount % 2 === 0 ? '#4CAF50' : '#ff9800';
                flashCount++;
                if (flashCount >= 6) {
                    clearInterval(flashInterval);
                    micLevelBar.style.background = 'linear-gradient(90deg, #4CAF50, #ff9800, #f44336)';
                    this.addLogEntry('Microphone test completed', 'success');
                }
            }, 500);
        }
    }

    addLogEntry(message, type = 'normal') {
        const activityLog = document.getElementById('activityLog');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        
        activityLog.appendChild(logEntry);
        activityLog.scrollTop = activityLog.scrollHeight;

        // Keep only last 50 log entries
        while (activityLog.children.length > 50) {
            activityLog.removeChild(activityLog.firstChild);
        }
    }

    // WebRTC implementation methods (simplified for now)
    async createPeerConnection(userId) {
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        const peerConnection = new RTCPeerConnection(config);
        this.peerConnections.set(userId, peerConnection);

        // Add local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            const remoteStream = event.streams[0];
            this.remoteAudio.srcObject = remoteStream;
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('webrtc-ice-candidate', {
                    target: userId,
                    candidate: event.candidate
                });
            }
        };

        return peerConnection;
    }

    async handleWebRTCOffer(data) {
        const peerConnection = await this.createPeerConnection(data.sender);
        await peerConnection.setRemoteDescription(data.offer);
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        this.socket.emit('webrtc-answer', {
            target: data.sender,
            answer: answer
        });
    }

    async handleWebRTCAnswer(data) {
        const peerConnection = this.peerConnections.get(data.sender);
        if (peerConnection) {
            await peerConnection.setRemoteDescription(data.answer);
        }
    }

    async handleWebRTCIceCandidate(data) {
        const peerConnection = this.peerConnections.get(data.sender);
        if (peerConnection) {
            await peerConnection.addIceCandidate(data.candidate);
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WalkieTalkieApp();
});