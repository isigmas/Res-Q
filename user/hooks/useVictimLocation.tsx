import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

/**
 * Victim location data structure (ONLINE mode)
 * 
 * This represents the TARGET location for compass navigation.
 * The rescuer app will use this to calculate bearing and distance
 * from the rescuer's current position to the victim's position.
 */
/**
 * Custom hook to receive victim's location updates via WebSocket in ONLINE mode
 * 
 * USE CASE: Compass Navigation with Bidirectional Location Exchange
 * This hook provides real-time TARGET (victim) location that the compass will point to.
 * 
 * BIDIRECTIONAL COMMUNICATION:
 * - Server → Client: Receives victim's location updates in real-time
 * - Client → Server: Automatically sends rescuer's location back when receiving updates
 * 
 * The compass component should:
 * 1. Get rescuer's current location (from device GPS via useRescuerLocation)
 * 2. Get victim's location (from this hook - updated in real-time via WebSocket)
 * 3. Calculate bearing angle from rescuer → victim
 * 4. Calculate distance from rescuer → victim
 * 5. Display compass arrow pointing toward victim
 * 
 * Features:
 * - Establishes WebSocket connection for real-time location updates
 * - Receives victim location updates instantly when position changes (server-push)
 * - Automatically sends rescuer's GPS location back to server on each victim update
 * - Auto-reconnects on connection loss with exponential backoff
 * - Returns last known valid location on connection error (maintains continuity)
 * - Cleans up WebSocket connection on unmount (prevents memory leaks)
 * - Returns null if no location data has been received yet
 * 
 * BENEFITS over HTTP polling:
 * - Instant updates (no delay)
 * - Lower battery usage (no repeated requests)
 * - Reduced server load (server pushes only when position changes)
 * - Server knows rescuer's position for coordination/safety
 * 
 * @param victimId - The unique identifier for the victim to track
 * @returns VictimLocation object (target for compass) or null if no data available yet
 * 
 * @example
 * ```tsx
 * function CompassScreen({ victimId }: { victimId: string }) {
 *   // This hook automatically handles bidirectional location exchange
 *   const victimLocation = useVictimLocation(victimId);
 *   
 *   if (!victimLocation) {
 *     return <LoadingSpinner />;
 *   }
 *   
 *   const bearing = calculateBearing(rescuerLocation, victimLocation);
 *   const distance = calculateDistance(rescuerLocation, victimLocation);
 *   
 *   return <Compass bearing={bearing} distance={distance} />;
 * }
 * ```
 */
/**
 * Victim's device location hook (used in the `user/` app where the victim sends their
 * own GPS position). This hook returns the current device GPS position and handles
 * permissions and watching the device location.
 */
export interface VictimLocation {
  lat: number;
  lon: number;
  alt: number | null;
  accuracy: number;
  timestamp: number;
}

export function useVictimLocation(): VictimLocation | null {
  const [location, setLocation] = useState<VictimLocation | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (__DEV__) console.warn('Location permission denied (victim)');
          setHasPermission(false);
          return;
        }

        setHasPermission(true);

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 5,
          },
          (pos) => {
            setLocation({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              alt: pos.coords.altitude,
              accuracy: pos.coords.accuracy || 0,
              timestamp: pos.timestamp,
            });
          }
        );
      } catch (error) {
        if (__DEV__) console.error('Failed to initialize victim location:', error);
      }
    };

    init();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  return hasPermission ? location : null;
}
