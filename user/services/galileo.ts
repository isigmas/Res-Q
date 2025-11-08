/**
 * Galileo Service - WebSocket-based rescue team location tracking
 * 
 * PURPOSE: Provides real-time rescuer location data for the victim's app.
 * The victim app subscribes to location updates from their assigned rescuer,
 * then displays the rescuer's position on map and compass.
 * 
 * ARCHITECTURE:
 * - Uses WebSocket for real-time communication
 * - Server pushes rescuer location updates to victim
 * - Victim sends their location updates to rescuer
 * - Auto-reconnects on connection loss
 */

import { Platform } from 'react-native';

export interface LocationMessage {
  type: 'tourist' | 'rescuer';
  user_id: string;
  latitude: number;   // Location latitude
  longitude: number;  // Location longitude
  altitude: number;   // Altitude in meters
  accuracy: number;   // Location accuracy (0.0 - 1.0)
  timestamp: string;  // ISO 8601 timestamp
}



/**
 * Callback function type for receiving location updates
 */
type LocationUpdateCallback = (location: LocationMessage) => void;

/**
 * Callback function type for connection errors
 */
type ErrorCallback = (error: Event | Error) => void;

/**
 * WebSocket connection manager for victim location tracking
 * 
 * Manages a persistent WebSocket connection to receive real-time location updates.
 * Handles connection lifecycle, reconnection, and message parsing.
 */

export class GalileoWebSocket {
  private ws: WebSocket | null = null;
  private victimId: string;
  private onLocationUpdate: LocationUpdateCallback;
  private onError: ErrorCallback;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2 seconds
  private isIntentionallyClosed = false;

  constructor(
    victimId: string,
    onLocationUpdate: LocationUpdateCallback,
    onError: ErrorCallback
  ) {
    this.victimId = victimId;
    this.onLocationUpdate = onLocationUpdate;
    this.onError = onError;
  }

  /**
   * Establish WebSocket connection to the backend
   */
  connect(): void {
    const wsEndpoint = `${process.env.EXPO_PUBLIC_WS_URL}/tourist`;

    try {
      this.ws = new WebSocket(wsEndpoint);
      this.isIntentionallyClosed = false;

      this.ws.onopen = () => {
        if (__DEV__) {
          console.log(`WebSocket connected for victim ${this.victimId}`);
        }
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;
        this.reconnectDelay = 2000;

        // Optional: Send authentication or subscription message
        // this.ws?.send(JSON.stringify({ type: 'subscribe', victimId: this.victimId }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data: LocationMessage = JSON.parse(event.data);
          
          // Validate the data has required fields
          if (data.latitude !== undefined && 
              data.longitude !== undefined && 
              data.type !== undefined) {
            this.onLocationUpdate(data);
          } else {
            if (__DEV__) {
              console.warn('Received invalid location data:', data);
            }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      // WebSocket onerror receives an Event in React Native — it isn't always an Error instance.
      // Log useful details and forward the raw event to the provided onError handler.
      this.ws.onerror = (event: any) => {
        if (__DEV__) {
          // Try to extract a message when available, otherwise print the event object
          const msg = event?.message || event?.reason || event;
          console.error('WebSocket error (victim):', msg);
        }
        this.onError(event);
      };

      this.ws.onclose = (event) => {
        if (__DEV__) {
          console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
        }

        // Attempt to reconnect unless intentionally closed
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.onError(error as Error);
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

    if (__DEV__) {
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    }

    setTimeout(() => {
      if (!this.isIntentionallyClosed) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Close the WebSocket connection
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is currently connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send victim's current location to the server
   * 
   * @param location - The victim's current GPS location
   */
  sendVictimLocation(location: {
    lat: number;
    lon: number;
    alt: number | null;
    accuracy: number;
    timestamp: number;
  }): void {
    if (!this.isConnected()) {
      if (__DEV__) {
        console.warn('Cannot send victim location: WebSocket not connected');
      }
      return;
    }

    const message = {
      type: 'victim_location',
      victim_id: this.victimId,
      latitude: location.lat,
      longitude: location.lon,
      altitude: location.alt,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
    };

    try {
      this.ws?.send(JSON.stringify(message));
      
      if (__DEV__) {
        console.log('Sent victim location to server:', message);
      }
    } catch (error) {
      console.error('Failed to send victim location:', error);
    }
  }
}
