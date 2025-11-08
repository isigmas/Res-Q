// --- ODBIERANE Z SERWERA ---
export interface LostPersonLocationPayload {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  timestamp: number;
  user_id: string | null;
}

//Wiadomość o lokalizacji OSOBY ZAGINIONEJ,
export interface LostPersonLocationMessage {
  type: "tourist_location";
  data: LostPersonLocationPayload;
}

export type MessageReceived = LostPersonLocationMessage;

// --- WYSYŁANE DO SERWERA ---
export interface RescuerLocationPayload {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  timestamp: number;
  user_id: string | null;
}

//Wiadomość o lokalizacji RATOWNIKA,
export interface RescuerLocationUpdate {
  type: "rescuer_location";
  payload: RescuerLocationPayload;
}

export type MessageToSend = RescuerLocationUpdate;
