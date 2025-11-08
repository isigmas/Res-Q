#!/usr/bin/env node

/**
 * Simple WebSocket Test Server for Res-Q Victim Location Tracking
 *
 * This server simulates the backend WebSocket API for testing the rescuer app.
 * It can send victim location updates and receive rescuer location messages.
 *
 * Usage:
 * 1. Install dependencies: npm install ws
 * 2. Run: node test-server.js
 * 3. Update your .env: EXPO_PUBLIC_WS_URL=ws://localhost:3000
 * 4. Test in the app
 */

const WebSocket = require('ws');

const PORT = 3000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 Res-Q Test WebSocket Server running on ws://localhost:${PORT}`);
console.log(`📡 Ready to simulate victim location updates...`);

// Simulate victim location data
let victimLocation = {
  user_id: "test-victim-123",
  latitude: 49.2345123,
  longitude: 19.9852231,
  altitude: 1342.7,
  accuracy: 0.9,
  timestamp: new Date().toISOString()
};

// Store connected clients
const clients = new Map();

wss.on('connection', (ws, request) => {
  const url = new URL(request.url, 'http://localhost');
  // Parse victim ID from path like /ws/victims/test-victim-123/location
  const pathParts = url.pathname.split('/');
  const victimId = pathParts[3]; // /ws/victims/{victimId}/location

  console.log(`🔗 New connection for victim: ${victimId}`);
  clients.set(victimId, ws);

  // Send initial victim location
  ws.send(JSON.stringify(victimLocation));
  console.log(`📤 Sent initial victim location:`, victimLocation);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'rescuer_location') {
        console.log(`📥 Received rescuer location:`, {
          rescuer_id: message.rescuer_id || 'unknown',
          lat: message.latitude.toFixed(6),
          lon: message.longitude.toFixed(6),
          alt: message.altitude,
          accuracy: message.accuracy,
          timestamp: new Date(message.timestamp).toLocaleTimeString()
        });
      } else {
        console.log(`📥 Received unknown message:`, message);
      }
    } catch (error) {
      console.error('❌ Failed to parse message:', error.message);
    }
  });

  ws.on('close', () => {
    console.log(`🔌 Connection closed for victim: ${victimId}`);
    clients.delete(victimId);
  });

  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for victim ${victimId}:`, error.message);
  });
});

// Simulate victim movement every 3 seconds
setInterval(() => {
  // Simulate small movement (walking pace)
  const movement = (Math.random() - 0.5) * 0.0001; // ~10 meters
  victimLocation.latitude += movement;
  victimLocation.longitude += movement * 0.5;
  victimLocation.timestamp = new Date().toISOString();

  // Send to all connected clients
  clients.forEach((ws, victimId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(victimLocation));
      console.log(`📤 Sent updated victim location to ${victimId}:`, {
        lat: victimLocation.latitude.toFixed(6),
        lon: victimLocation.longitude.toFixed(6),
        alt: victimLocation.altitude,
        timestamp: victimLocation.timestamp
      });
    }
  });
}, 3000);

console.log(`\n📋 Test Commands:`);
console.log(`1. Start the server: node test-server.js`);
console.log(`2. In another terminal, start your Expo app: npx expo start`);
console.log(`3. Use victim ID: "test-victim-123" in your app`);
console.log(`4. Watch console for bidirectional location exchange`);
console.log(`\n⚠️  Remember to set EXPO_PUBLIC_WS_URL=ws://localhost:3000 in .env`);

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  wss.close();
  process.exit(0);
});
