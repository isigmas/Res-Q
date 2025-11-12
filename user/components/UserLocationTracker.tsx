import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ReadyState } from "react-use-websocket";
import { useUserSocket } from "../contexts/WebSocketContext";
import { useInterval } from "../hooks/useInterval";
import { UserLocationUpdate } from "../types/websocketTypes";

// Jak często wysyłać lokalizację użytkownika
const SEND_INTERVAL_MS = 3000;

export const UserLocationTracker = () => {
    const { sendJsonMessage, readyState } = useUserSocket();
    const [hasPermissions, setHasPermissions] = useState(false);

    useEffect(() => {
        const requestPermissions = async () => {
            console.log(
                "[UserLocationTracker] Żądanie uprawnień do lokalizacji..."
            );
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.error(
                    "[UserLocationTracker] Odmówiono uprawnień do lokalizacji!"
                );
                setHasPermissions(false);
                return;
            }
            console.log(
                "[UserLocationTracker] Uprawnienia przyznane. Rozpoczynam wysyłanie lokalizacji co 3s..."
            );
            setHasPermissions(true);
        };
        requestPermissions();
    }, []);

    useInterval(
        () => {
            // Uruchom logikę wysyłania co interwał
            sendCurrentLocation();
        },
        hasPermissions ? SEND_INTERVAL_MS : null
    );

    // Logika pobierania i wysyłania lokalizacji
    const sendCurrentLocation = async () => {
        if (readyState !== ReadyState.OPEN) {
            console.log(
                "[UserLocationTracker] WebSocket nie jest połączony. Pomiń wysyłanie lokalizacji."
            );
            return;
        }

        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const message: UserLocationUpdate = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                altitude: location.coords.altitude,
                accuracy: location.coords.accuracy || 0,
                timestamp: location.timestamp,
            };

            console.log(
                "[UserLocationTracker] Wysyłanie lokalizacji użytkownika:",
                message
            );
            sendJsonMessage({
                type: "tourist_location",
                payload: message,
            });
        } catch (error) {
            console.error(
                "[UserLocationTracker] Błąd podczas pobierania lokalizacji:",
                error
            );
        }
    };
    return null;
};
