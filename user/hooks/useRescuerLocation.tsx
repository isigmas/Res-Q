import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

/**
 * Rescuer's current location data (from device GPS)
 */
export interface RescuerLocation {
  lat: number;
  lon: number;
  alt: number | null;
  accuracy: number;
  timestamp: number;
}

/**
 * Hook to get the rescuer's current location from device GPS
 * 
 * This provides the rescuer's real-time position which is:
 * 1. Used for compass calculations (rescuer → victim bearing)
 * 2. Sent back to server when receiving victim location updates
 * 
 * Features:
 * - Requests location permissions on mount
 * - Watches device GPS position with high accuracy
 * - Updates whenever device position changes
 * - Cleans up location watcher on unmount
 * 
 * @returns RescuerLocation object or null if no permission/location yet
 */
export function useRescuerLocation(): RescuerLocation | null {
  const [location, setLocation] = useState<RescuerLocation | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

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
            const rescuerLocation: RescuerLocation = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              alt: position.coords.altitude,
              accuracy: position.coords.accuracy || 0,
              timestamp: position.timestamp,
            };
            
            setLocation(rescuerLocation);
          }
        );
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to initialize location tracking:', error);
        }
      }
    };

    initializeLocation();

    // Cleanup: stop watching location
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  return hasPermission ? location : null;
}
