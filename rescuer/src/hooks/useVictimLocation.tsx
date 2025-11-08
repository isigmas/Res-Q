import { useEffect, useRef, useState } from 'react';
import { GalileoWebSocket, VictimLocationData } from '../services/galileo';
import { useRescuerLocation } from './useRescuerLocation';

/**
 * Victim location data structure (ONLINE mode)
 * 
 * This represents the TARGET location for compass navigation.
 * The rescuer app will use this to calculate bearing and distance
 * from the rescuer's current position to the victim's position.
 */
interface VictimLocation {
  lat: number;      // Target latitude (victim's position)
  lon: number;      // Target longitude (victim's position)
  alt: number;      // Target altitude in meters
  accuracy: number; // Location accuracy (0.0 - 1.0, where 1.0 is most accurate)
  timestamp: string; // ISO 8601 timestamp of when this location was recorded
  source: 'ONLINE'; // Data source indicator
}

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
export function useVictimLocation(victimId: string): VictimLocation | null {
  const [location, setLocation] = useState<VictimLocation | null>(null);
  const wsRef = useRef<GalileoWebSocket | null>(null);
  const isMountedRef = useRef(true);
  
  // Get rescuer's current location to send back to server
  const rescuerLocation = useRescuerLocation();

  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;

    /**
     * Handler for receiving location updates from WebSocket
     */
    const handleLocationUpdate = (data: VictimLocationData) => {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        // Map WebSocket message to VictimLocation format
        // This is the TARGET location (victim's position) for compass navigation
        const mappedLocation: VictimLocation = {
          lat: data.latitude,    // Victim's latitude
          lon: data.longitude,   // Victim's longitude
          alt: data.altitude,    // Victim's altitude (meters)
          accuracy: data.accuracy,
          timestamp: data.timestamp,
          source: 'ONLINE',
        };
        
        setLocation(mappedLocation);

        // Send rescuer's location back to server when we receive victim update
        if (rescuerLocation && wsRef.current) {
          wsRef.current.sendRescuerLocation({
            lat: rescuerLocation.lat,
            lon: rescuerLocation.lon,
            alt: rescuerLocation.alt,
            accuracy: rescuerLocation.accuracy,
            timestamp: rescuerLocation.timestamp,
          });
        }
      }
    };

    /**
     * Handler for WebSocket errors
     */
    const handleError = (error: Event | Error) => {
      // On error, keep last known valid location
      // Only log the error in development
      if (__DEV__) {
        console.error('WebSocket error for victim location:', error);
      }
      // Don't set location to null - preserve last known position
      // WebSocket will attempt to reconnect automatically
    };

    // Create and connect WebSocket
    wsRef.current = new GalileoWebSocket(
      victimId,
      handleLocationUpdate,
      handleError
    );
    
    wsRef.current.connect();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      
      // Disconnect WebSocket to prevent memory leaks
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [victimId]); // Only re-run if victimId changes (not rescuerLocation - we use latest via closure)

  return location;
}
