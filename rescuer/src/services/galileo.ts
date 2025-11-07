/**
 * Galileo Service - WebSocket-based real-time victim location tracking
 * 
 * PURPOSE: Provides real-time victim location data for compass navigation via WebSocket.
 * The rescuer app subscribes to location updates for a specific victim,
 * then calculates bearing and distance from rescuer → victim.
 * 
 * ARCHITECTURE:
 * - Uses WebSocket for bi-directional, real-time communication
 * - Server pushes location updates whenever victim's position changes
 * - More efficient than HTTP polling (no unnecessary requests)
 * - Auto-reconnects on connection loss
 */

export interface VictimLocationData {
  user_id: string;
  latitude: number;   // Victim's latitude (target position)
  longitude: number;  // Victim's longitude (target position)
  altitude: number;   // Victim's altitude in meters
  accuracy: number;   // Location accuracy (0.0 - 1.0)
  timestamp: string;  // ISO 8601 timestamp
}

/**
 * Callback function type for receiving location updates
 */
type LocationUpdateCallback = (location: VictimLocationData) => void;

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
    // TODO: Replace with actual WebSocket URL from environment config
    const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000';
    const wsEndpoint = `${WS_URL}/ws/victims/${this.victimId}/location`;

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
          const data: VictimLocationData = JSON.parse(event.data);
          
          // Validate the data has required fields
          if (data.latitude !== undefined && data.longitude !== undefined) {
            this.onLocationUpdate(data);
          } else {
            console.warn('Received invalid location data:', data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        if (__DEV__) {
          console.error('WebSocket error:', error);
        }
        this.onError(error);
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
}
