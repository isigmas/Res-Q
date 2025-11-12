import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { GalileoWebSocket } from '../services/galileo';

/**
 * Victim's GPS location data
 */
export interface VictimLocation {
  lat: number;        // Victim's latitude
  lon: number;        // Victim's longitude
  alt: number | null; // Victim's altitude in meters (if available)
  accuracy: number;   // Location accuracy (0.0 - 1.0)
  timestamp: number;  // Timestamp in milliseconds
}

/**
 * Hook to get and broadcast the victim's current location
 *
 * This hook:
 * 1. Gets real-time GPS position from device
 * 2. Sends location updates to rescuers via WebSocket
 * 3. Handles permissions and location watching
 *
 * Features:
 * - High-precision GPS tracking
 * - Real-time WebSocket broadcasting
 * - Permission handling
 * - Automatic cleanup
 *
 * @returns VictimLocation object or null if no permission/location
 */
export function useVictimLocation(): VictimLocation | null {
  const [location, setLocation] = useState<VictimLocation | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const wsRef = useRef<GalileoWebSocket | null>(null);
  const victimId = "test-victim-123"; // TODO: Get from auth/context

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    /**
     * Request location permissions and start watching position
     */
    const initializeLocation = async () => {
      try {
        // Request foreground location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (__DEV__) {
            console.warn('Location permission denied');
          }
          setHasPermission(false);
          return;
        }

        setHasPermission(true);

        // Start watching location with high accuracy
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,      // Update at most every 1 second
            distanceInterval: 5,     // Update when moved at least 5 meters
          },
          (position: Location.LocationObject) => {
            const newLocation: VictimLocation = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              alt: position.coords.altitude,
              accuracy: position.coords.accuracy || 0,
              timestamp: position.timestamp,
            };

            setLocation(newLocation);

            // Send location update through WebSocket
            if (wsRef.current?.isConnected()) {
              wsRef.current.sendVictimLocation({
                lat: newLocation.lat,
                lon: newLocation.lon,
                alt: newLocation.alt,
                accuracy: newLocation.accuracy,
                timestamp: position.timestamp,
              });
            }
          }
        );
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to initialize location tracking:', error);
        }
      }
    };

    // Initialize WebSocket and location tracking
    wsRef.current = new GalileoWebSocket(
      victimId,
      () => {}, // We don't need to handle incoming messages
      (error) => {
        if (__DEV__) {
          console.error('WebSocket error:', error);
        }
      }
    );

    wsRef.current.connect();
    initializeLocation();

    // Cleanup: stop watching location and disconnect WebSocket
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, []);

  return hasPermission ? location : null;
}
