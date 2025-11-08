// --- ODBIERANE Z SERWERA ---
export interface LostPersonLocationPayload {
  latitude: number;
  longitude: number;

  //   timestamp: number;
  //   accuracy: number;
}

//Wiadomość o lokalizacji OSOBY ZAGINIONEJ,
export interface LostPersonLocationMessage {
  type: "LOST_PERSON_LOCATION";
  data: LostPersonLocationPayload;
}

export type MessageReceived = LostPersonLocationMessage;

// --- WYSYŁANE DO SERWERA ---
export interface RescuerLocationPayload {
  latitude: number;
  longitude: number;
  //timestamp: number;
}

//Wiadomość o lokalizacji RATOWNIKA,
export interface RescuerLocationUpdate {
  type: "RESCUER_LOCATION_UPDATE";
  payload: RescuerLocationPayload;
}

export type MessageToSend = RescuerLocationUpdate;
