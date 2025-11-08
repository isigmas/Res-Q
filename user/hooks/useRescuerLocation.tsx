import { useState, useEffect, useRef } from 'react';
import { GalileoWebSocket, VictimLocationData } from '../services/galileo';
import { useVictimLocation } from './useVictimLocation';

/**
 * Victim location structure returned from server
 */
interface VictimLocation {
  lat: number;
  lon: number;
  alt: number;
  accuracy: number;
  timestamp: string;
  source?: 'ONLINE';
}

/**
 * Custom hook to receive victim's location updates via WebSocket in ONLINE mode.
 *
 * In the `user/` app we treat this hook as the remote receiver of the victim's
 * location (i.e., the rescuer role). It connects to the WebSocket and returns
 * the latest victim location. It will also send the current device (victim)
 * GPS back to server when receiving updates, using `useVictimLocation`.
 */
export function useRescuerLocation(victimId: string): VictimLocation | null {
  const [location, setLocation] = useState<VictimLocation | null>(null);
  const wsRef = useRef<GalileoWebSocket | null>(null);
  const isMountedRef = useRef(true);

  // Device GPS (now named victim location hook) used to send our own position
  const deviceLocation = useVictimLocation();

  useEffect(() => {
    isMountedRef.current = true;

    const handleLocationUpdate = (data: VictimLocationData) => {
      if (!isMountedRef.current) return;

      const mapped: VictimLocation = {
        lat: data.latitude,
        lon: data.longitude,
        alt: data.altitude,
        accuracy: data.accuracy,
        timestamp: data.timestamp,
        source: 'ONLINE',
      };

      setLocation(mapped);

      // Optionally send our device GPS back to server so server knows sender position
      if (deviceLocation && wsRef.current) {
        wsRef.current.sendRescuerLocation({
          lat: deviceLocation.lat,
          lon: deviceLocation.lon,
          alt: deviceLocation.alt,
          accuracy: deviceLocation.accuracy,
          timestamp: deviceLocation.timestamp,
        });
      }
    };

    const handleError = (err: Event | Error) => {
      if (__DEV__) console.error('WebSocket error (rescuer):', err);
    };

    wsRef.current = new GalileoWebSocket(victimId, handleLocationUpdate, handleError);
    wsRef.current.connect();

    return () => {
      isMountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [victimId]);

  return location;
}
