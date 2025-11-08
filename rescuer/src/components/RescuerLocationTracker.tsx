import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ReadyState } from "react-use-websocket";
import { useRescuerSocket } from "../contexts/WebSocketContext";
import { useInterval } from "../hooks/useInterval";
import { RescuerLocationUpdate } from "../types/websocketTypes";

// Jak często wysyłać lokalizację ratownika
const SEND_INTERVAL_MS = 5000;

export const RescuerLocationTracker = () => {
  const { sendJsonMessage, readyState } = useRescuerSocket();
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Odmówiono uprawnień do lokalizacji!");
        setHasPermissions(false);
        return;
      }
      // let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      setHasPermissions(true);
      console.log("Uprawnienia do lokalizacji przyznane.");
    };
    requestPermissions();
  }, []);

  useInterval(
    () => {
      //update rescuer location
      sendCurrentLocation();
    },
    hasPermissions ? SEND_INTERVAL_MS : null
  );

  // Logika pobierania i wysyłania lokalizacji
  const sendCurrentLocation = async () => {
    if (readyState !== ReadyState.OPEN) {
      console.log("WebSocket nie jest połączony. Pomiń wysyłanie lokalizacji.");
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const message: RescuerLocationUpdate = {
        type: "rescuer_location",
        payload: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          timestamp: Date.now(),
          user_id: null,
        },
      };

      console.log("Wysyłanie lokalizacji ratownika...", message.payload);
      sendJsonMessage(message);
    } catch (error) {
      console.error("Błąd podczas pobierania lokalizacji ratownika:", error);
    }
  };
  return null;
};
