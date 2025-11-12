export interface RescuerLocationPayload {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    timestamp: number;
}

export interface RescuerLocationMessage {
    type: "rescuer_location";
    data: RescuerLocationPayload;
}

export type MessageReceived = RescuerLocationMessage | RescuerLocationPayload;

// --- WYSYŁANE DO SERWERA ---
// Tourist wysyła swoją lokalizację
export interface UserLocationUpdate {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    timestamp: number;
}

export type MessageToSend = UserLocationUpdate;
