// Inrico T320 Hardware Integration Module
class InricoT320Integration {
    constructor(app) {
        this.app = app;
        this.isInricoDevice = false;
        this.hardwareButtons = new Map();
        this.lastButtonStates = new Map();
        this.pollInterval = null;
        
        this.init();
    }

    init() {
        this.detectInricoDevice();
        this.setupHardwareButtonPolling();
        this.setupDeviceSpecificFeatures();
    }

    detectInricoDevice() {
        // Check for Inrico T320 specific indicators
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroid = userAgent.includes('android');
        const hasInricoIndicators = userAgent.includes('inrico') || 
                                  userAgent.includes('t320') ||
                                  this.app.deviceType === 'inrico-t320';

        this.isInricoDevice = isAndroid && hasInricoIndicators;
        
        if (this.isInricoDevice) {
            this.app.addLogEntry('Inrico T320 device detected', 'success');
            this.enableInricoMode();
        }
    }

    enableInricoMode() {
        document.body.classList.add('inrico-mode');
        
        // Apply device-specific settings
        this.optimizeForInrico();
        
        // Enable hardware button polling
        this.startHardwareButtonPolling();
        
        // Setup device-specific event handlers
        this.setupInricoEventHandlers();
    }

    optimizeForInrico() {
        // Optimize audio settings for Inrico T320
        const audioSettings = {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false, // Inrico handles AGC
            sampleRate: 44100
        };

        // Apply optimized settings
        if (this.app.localStream) {
            const audioTracks = this.app.localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.applyConstraints(audioSettings);
            });
        }

        // Optimize UI for device
        this.optimizeUIForInrico();
    }

    optimizeUIForInrico() {
        // Add CSS class for device-specific styling
        document.body.classList.add('inrico-optimized');
        
        // Adjust PTT button size
        const pttButton = document.getElementById('pttButton');
        if (pttButton) {
            pttButton.style.width = '250px';
            pttButton.style.height = '250px';
            pttButton.style.fontSize = '1.2rem';
        }

        // Enable high contrast mode
        document.body.classList.add('high-contrast');
        
        // Show hardware button instructions
        this.showInricoInstructions();
    }

    showInricoInstructions() {
        const instructionsElement = document.querySelector('.ptt-instructions');
        if (instructionsElement) {
            const inricoInstructions = document.createElement('div');
            inricoInstructions.className = 'inrico-instructions';
            inricoInstructions.innerHTML = `
                <h4>Inrico T320 Controls:</h4>
                <p>• <strong>PTT Button</strong>: Press and hold to transmit</p>
                <p>• <strong>Vol+/Vol-</strong>: Adjust speaker volume</p>
                <p>• <strong>Power Button</strong>: Long press for settings</p>
                <p>• Hardware buttons take priority over touch controls</p>
            `;
            instructionsElement.appendChild(inricoInstructions);
        }
    }

    setupHardwareButtonPolling() {
        // Check if Gamepad API is available (used for hardware buttons)
        if (typeof navigator.getGamepads !== 'function') {
            this.app.addLogEntry('Hardware button support not available', 'error');
            return;
        }

        this.pollInterval = setInterval(() => {
            this.pollHardwareButtons();
        }, 50); // 20Hz polling rate for responsive button detection
    }

    startHardwareButtonPolling() {
        if (this.pollInterval) return; // Already polling
        
        this.setupHardwareButtonPolling();
        this.app.addLogEntry('Hardware button polling started', 'system');
    }

    stopHardwareButtonPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            this.app.addLogEntry('Hardware button polling stopped', 'system');
        }
    }

    pollHardwareButtons() {
        try {
            const gamepads = navigator.getGamepads();
            
            for (let i = 0; i < gamepads.length; i++) {
                const gamepad = gamepads[i];
                if (!gamepad) continue;

                this.processGamepadButtons(gamepad, i);
            }
        } catch (error) {
            console.error('Error polling hardware buttons:', error);
        }
    }

    processGamepadButtons(gamepad, gamepadIndex) {
        const buttons = gamepad.buttons;
        
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const buttonId = `${gamepadIndex}-${i}`;
            const wasPressed = this.lastButtonStates.get(buttonId) || false;
            const isPressed = button.pressed;

            // Detect button state changes
            if (isPressed !== wasPressed) {
                this.handleButtonStateChange(buttonId, i, isPressed);
                this.lastButtonStates.set(buttonId, isPressed);
            }
        }
    }

    handleButtonStateChange(buttonId, buttonIndex, isPressed) {
        switch (buttonIndex) {
            case 0: // PTT Button (typically first button)
                this.handlePTTButton(isPressed);
                break;
                
            case 1: // Volume Up
                if (isPressed) {
                    this.handleVolumeUp();
                }
                break;
                
            case 2: // Volume Down
                if (isPressed) {
                    this.handleVolumeDown();
                }
                break;
                
            case 3: // Additional button (could be channel switch)
                if (isPressed) {
                    this.handleChannelSwitch();
                }
                break;
                
            default:
                console.log(`Hardware button ${buttonIndex} ${isPressed ? 'pressed' : 'released'}`);
        }
    }

    handlePTTButton(isPressed) {
        if (isPressed && !this.app.isPTTPressed) {
            this.app.startPTT();
            this.app.addLogEntry('Hardware PTT activated', 'system');
        } else if (!isPressed && this.app.isPTTPressed) {
            this.app.stopPTT();
            this.app.addLogEntry('Hardware PTT released', 'system');
        }
    }

    handleVolumeUp() {
        const speakerVolume = document.getElementById('speakerVolume');
        if (speakerVolume) {
            const currentVolume = parseInt(speakerVolume.value);
            const newVolume = Math.min(100, currentVolume + 10);
            speakerVolume.value = newVolume;
            speakerVolume.dispatchEvent(new Event('input'));
            this.app.addLogEntry(`Volume: ${newVolume}%`, 'system');
        }
    }

    handleVolumeDown() {
        const speakerVolume = document.getElementById('speakerVolume');
        if (speakerVolume) {
            const currentVolume = parseInt(speakerVolume.value);
            const newVolume = Math.max(0, currentVolume - 10);
            speakerVolume.value = newVolume;
            speakerVolume.dispatchEvent(new Event('input'));
            this.app.addLogEntry(`Volume: ${newVolume}%`, 'system');
        }
    }

    handleChannelSwitch() {
        // Cycle through channels
        const channels = document.querySelectorAll('.channel-item');
        const activeChannel = document.querySelector('.channel-item.active');
        
        if (channels.length > 0) {
            let nextIndex = 0;
            
            if (activeChannel) {
                const currentIndex = Array.from(channels).indexOf(activeChannel);
                nextIndex = (currentIndex + 1) % channels.length;
            }
            
            channels[nextIndex].click();
            this.app.addLogEntry('Channel switched via hardware button', 'system');
        }
    }

    setupInricoEventHandlers() {
        // Screen orientation change handling
        if (screen.orientation) {
            screen.orientation.addEventListener('change', () => {
                this.handleOrientationChange();
            });
        }

        // Battery level monitoring (if available)
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.monitorBattery(battery);
            });
        }

        // Network status monitoring
        window.addEventListener('online', () => {
            this.app.addLogEntry('Network connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.app.addLogEntry('Network connection lost', 'error');
        });
    }

    handleOrientationChange() {
        // Adjust UI for orientation changes
        setTimeout(() => {
            this.optimizeUIForInrico();
        }, 100);
    }

    monitorBattery(battery) {
        const updateBatteryInfo = () => {
            const level = Math.round(battery.level * 100);
            
            // Show battery warning if low
            if (level < 20 && !battery.charging) {
                this.app.addLogEntry(`Low battery: ${level}%`, 'error');
            }
        };

        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);
        
        // Initial battery check
        updateBatteryInfo();
    }

    // Method to simulate hardware button press (for testing)
    simulateHardwareButton(buttonIndex, duration = 100) {
        this.handleButtonStateChange(`sim-0`, buttonIndex, true);
        
        setTimeout(() => {
            this.handleButtonStateChange(`sim-0`, buttonIndex, false);
        }, duration);
    }

    destroy() {
        this.stopHardwareButtonPolling();
        
        // Remove event listeners
        if (screen.orientation) {
            screen.orientation.removeEventListener('change', this.handleOrientationChange);
        }
        
        // Remove CSS classes
        document.body.classList.remove('inrico-mode', 'inrico-optimized', 'high-contrast');
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InricoT320Integration;
} else {
    window.InricoT320Integration = InricoT320Integration;
}