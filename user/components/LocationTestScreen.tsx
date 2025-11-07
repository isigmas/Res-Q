import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useVictimLocation } from '../hooks/useVictimLocation';
import { useRescuerLocation } from '../hooks/useRescuerLocation';

/**
 * Test Component for WebSocket Location Functionality
 *
 * This component allows you to test:
 * - WebSocket connection to server
 * - Receiving victim location updates
 * - Sending rescuer location back to server
 * - Location permissions and GPS access
 *
 * Usage: Add this to your app temporarily for testing
 */
export default function LocationTestScreen() {
  const victimLocation = useVictimLocation('test-victim-123');
  const rescuerLocation = useRescuerLocation();
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Track victim location updates
  useEffect(() => {
    if (victimLocation) {
      setUpdateCount(prev => prev + 1);
      setLastUpdateTime(new Date());
    }
  }, [victimLocation]);

  const formatLocation = (loc: any) => {
    if (!loc) return 'No location data';
    return `Lat: ${loc.lat?.toFixed(6) || 'N/A'}\nLon: ${loc.lon?.toFixed(6) || 'N/A'}\nAlt: ${loc.alt || 'N/A'}\nAcc: ${loc.accuracy || 'N/A'}`;
  };

  const formatTimestamp = (timestamp: string | number) => {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp === 'string'
      ? new Date(timestamp)
      : new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Location Test Screen</Text>

      {/* Rescuer Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Your Location (Rescuer)</Text>
        <Text style={styles.locationText}>
          {formatLocation(rescuerLocation)}
        </Text>
        {rescuerLocation && (
          <Text style={styles.timestamp}>
            Updated: {formatTimestamp(rescuerLocation.timestamp)}
          </Text>
        )}
        {!rescuerLocation && (
          <Text style={styles.warning}>
            ⚠️ No location - check permissions or GPS
          </Text>
        )}
      </View>

      {/* Victim Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Victim Location (Target)</Text>
        <Text style={styles.locationText}>
          {formatLocation(victimLocation)}
        </Text>
        {victimLocation && (
          <>
            <Text style={styles.timestamp}>
              Updated: {formatTimestamp(victimLocation.timestamp)}
            </Text>
            <Text style={styles.updateStats}>
              Updates received: {updateCount} | Last: {lastUpdateTime?.toLocaleTimeString() || 'N/A'}
            </Text>
          </>
        )}
        {!victimLocation && (
          <Text style={styles.connecting}>
            🔄 Connecting to victim... (check WebSocket server)
          </Text>
        )}
      </View>

      {/* Connection Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌐 Connection Status</Text>
        <Text style={styles.statusText}>
          Rescuer GPS: {rescuerLocation ? '✅ Active' : '❌ No permission/GPS'}
        </Text>
        <Text style={styles.statusText}>
          Victim WebSocket: {victimLocation ? '✅ Connected' : '❌ Connecting...'}
        </Text>
        <Text style={styles.statusText}>
          Bidirectional: {rescuerLocation && victimLocation ? '✅ Working' : '❌ Incomplete'}
        </Text>
      </View>

      {/* Test Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Test Actions</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Refresh Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Test WebSocket Reconnect</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Testing Instructions</Text>
        <Text style={styles.instructionText}>
          1. Start test server: cd rescuer && npm run test-server{'\n'}
          2. Set EXPO_PUBLIC_WS_URL=ws://localhost:3000{'\n'}
          3. Check console for rescuer location messages{'\n'}
          4. Victim location should update every 3 seconds{'\n'}
          5. Move around to test GPS updates
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#666',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  updateStats: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 3,
    fontWeight: 'bold',
  },
  warning: {
    color: '#ff6b35',
    fontWeight: 'bold',
  },
  connecting: {
    color: '#007bff',
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
