const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Store connected clients and channels
const clients = new Map();
const channels = new Map();

// Initialize default channels from config
config.channels.defaultChannels.forEach(channelConfig => {
  channels.set(channelConfig.id, { 
    name: channelConfig.name, 
    description: channelConfig.description,
    users: new Set() 
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/channels', (req, res) => {
  const channelList = Array.from(channels.entries()).map(([id, channel]) => ({
    id,
    name: channel.name,
    description: channel.description,
    userCount: channel.users.size
  }));
  res.json(channelList);
});

app.get('/api/config', (req, res) => {
  // Send client-safe configuration
  const clientConfig = {
    audio: config.audio,
    webrtc: config.webrtc,
    devices: config.devices,
    channels: config.channels
  };
  res.json(clientConfig);
});

app.get('/api/device/:deviceType', (req, res) => {
  const deviceType = req.params.deviceType;
  const deviceConfig = config.devices[deviceType];
  
  if (deviceConfig) {
    res.json(deviceConfig);
  } else {
    res.status(404).json({ error: 'Device type not found' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Store client info
  clients.set(socket.id, {
    id: socket.id,
    username: null,
    channel: null,
    isTransmitting: false
  });

  // Handle user registration
  socket.on('register', (data) => {
    const client = clients.get(socket.id);
    if (client) {
      client.username = data.username;
      client.deviceType = data.deviceType || 'web';
      console.log(`User registered: ${data.username} (${client.deviceType})`);
      
      // Send updated client info to all clients
      io.emit('user-update', {
        users: Array.from(clients.values()).filter(c => c.username)
      });
    }
  });

  // Handle channel joining
  socket.on('join-channel', (channelId) => {
    const client = clients.get(socket.id);
    if (!client) return;

    // Leave current channel
    if (client.channel && channels.has(client.channel)) {
      channels.get(client.channel).users.delete(socket.id);
      socket.leave(client.channel);
    }

    // Join new channel
    if (channels.has(channelId)) {
      client.channel = channelId;
      channels.get(channelId).users.add(socket.id);
      socket.join(channelId);
      
      console.log(`User ${client.username} joined channel ${channelId}`);
      
      // Notify channel users
      socket.to(channelId).emit('user-joined-channel', {
        username: client.username,
        channel: channelId
      });
      
      // Send updated channel info
      io.emit('channel-update', {
        channels: Array.from(channels.entries()).map(([id, channel]) => ({
          id,
          name: channel.name,
          userCount: channel.users.size
        }))
      });
    }
  });

  // Handle WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    socket.to(data.target).emit('webrtc-offer', {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on('webrtc-answer', (data) => {
    socket.to(data.target).emit('webrtc-answer', {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.target).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // Handle PTT events
  socket.on('ptt-start', () => {
    const client = clients.get(socket.id);
    if (client && client.channel) {
      client.isTransmitting = true;
      socket.to(client.channel).emit('transmission-start', {
        username: client.username,
        senderId: socket.id
      });
    }
  });

  socket.on('ptt-stop', () => {
    const client = clients.get(socket.id);
    if (client && client.channel) {
      client.isTransmitting = false;
      socket.to(client.channel).emit('transmission-stop', {
        username: client.username,
        senderId: socket.id
      });
    }
  });

  // Handle audio stream data
  socket.on('audio-stream', (audioData) => {
    const client = clients.get(socket.id);
    if (client && client.channel && client.isTransmitting) {
      socket.to(client.channel).emit('audio-stream', {
        audioData,
        senderId: socket.id,
        username: client.username
      });
    }
  });

  // Handle device discovery
  socket.on('discover-devices', () => {
    const client = clients.get(socket.id);
    if (client && client.channel) {
      const channelUsers = Array.from(channels.get(client.channel).users)
        .map(userId => clients.get(userId))
        .filter(user => user && user.username && user.id !== socket.id);
      
      socket.emit('devices-discovered', channelUsers);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const client = clients.get(socket.id);
    if (client) {
      console.log(`User disconnected: ${client.username || socket.id}`);
      
      // Remove from channel
      if (client.channel && channels.has(client.channel)) {
        channels.get(client.channel).users.delete(socket.id);
        socket.to(client.channel).emit('user-left-channel', {
          username: client.username,
          channel: client.channel
        });
      }
      
      // Remove client
      clients.delete(socket.id);
      
      // Send updated info to all clients
      io.emit('user-update', {
        users: Array.from(clients.values()).filter(c => c.username)
      });
      
      io.emit('channel-update', {
        channels: Array.from(channels.entries()).map(([id, channel]) => ({
          id,
          name: channel.name,
          userCount: channel.users.size
        }))
      });
    }
  });
});

const PORT = config.server.port;
server.listen(PORT, () => {
  console.log(`Aquadroom Walkie-Talkie Server running on port ${PORT}`);
  console.log(`Available channels: ${Array.from(channels.keys()).join(', ')}`);
});