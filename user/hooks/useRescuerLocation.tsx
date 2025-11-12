import { useState } from 'react';

/**
 * Rescuer location data structure (ONLINE mode)
 * 
 * This represents the CURRENT location from the rescuer's view.
 * Received via WebSocket from the rescuer's actual device.
 * The victim app will use this to calculate bearing and distance
 * to reach the rescuer's position.
 */
interface RescuerLocation {
  lat: number;      // Rescuer's latitude (target position)
  lon: number;      // Rescuer's longitude (target position)
  alt: number;      // Rescuer's altitude in meters
  accuracy: number; // Location accuracy (0.0 - 1.0, where 1.0 is most accurate)
  timestamp: string; // ISO 8601 timestamp of when this location was recorded
  source: 'ONLINE'; // Data source indicator
}

/**
 * Custom hook to receive rescuer's location updates via WebSocket
 * 
 * USE CASE: Victim's app subscribes to rescuer's location updates
 * to display rescuer's position on map and compass.
 * 
 * @param rescuerId - The unique identifier of the rescuer to track
 * @returns RescuerLocation object or null if no data available yet
 */
export function useRescuerLocation(): RescuerLocation {
  // Return fixed location for testing - Kraków Main Square
  return {
    lat: 50.0619474,          // Kraków Main Square latitude
    lon: 19.9368564,          // Kraków Main Square longitude
    alt: 219,                 // Approximate altitude of Kraków
    accuracy: 1.0,            // Perfect accuracy for testing
    timestamp: new Date().toISOString(),
    source: 'ONLINE'
  };
}
