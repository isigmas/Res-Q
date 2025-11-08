import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
    RescuerLocationMessage,
    MessageReceived,
} from "../types/websocketTypes";

const WEBSOCKET_URL = "wss://resq-backend-isp4g.ondigitalocean.app/ws/tourist";

interface UserSocketContextType {
    readyState: ReadyState;
    rescuerLocation: RescuerLocationMessage | null;
    sendJsonMessage: (message: any) => void;
}

const UserSocketContext = createContext<UserSocketContextType | undefined>(
    undefined
);

export const UserSocketProvider = ({ children }: { children: ReactNode }) => {
    const [rescuerLocation, setRescuerLocation] =
        useState<RescuerLocationMessage | null>(null);

    const { sendJsonMessage, lastJsonMessage, readyState } =
        useWebSocket<MessageReceived>(WEBSOCKET_URL, {
            share: true,
            shouldReconnect: () => true, // Zawsze próbuj połączyć ponownie
            reconnectInterval: 3000, // Próbuj połączyć ponownie co 3 sekundy
            retryOnError: true,
            onOpen: () => {
                console.log("[WebSocket] Połączono z:", WEBSOCKET_URL);
            },
            onClose: () => {
                console.log("[WebSocket] Rozłączono");
            },
            onError: (error) => {
                console.log("[WebSocket] Błąd:", error);
            },
        });

    useEffect(() => {
        console.log("[WebSocket] Odebrana wiadomość:", lastJsonMessage);
        if (lastJsonMessage) {
            console.log("[WebSocket] Typ wiadomości:", lastJsonMessage.type);
            console.log(
                "[WebSocket] Dane wiadomości:",
                JSON.stringify(lastJsonMessage, null, 2)
            );

            if (lastJsonMessage.type === "rescuer_location") {
                console.log(
                    "[WebSocket] Zapisywanie lokalizacji ratownika:",
                    lastJsonMessage
                );
                setRescuerLocation(lastJsonMessage as RescuerLocationMessage);
            } else {
                console.log(
                    "[WebSocket] Nieznany typ wiadomości:",
                    lastJsonMessage.type
                );
            }
        }
    }, [lastJsonMessage]);

    useEffect(() => {
        console.log("[WebSocket] Status połączenia zmieniony:", readyState);
        const statusMap = {
            0: "CONNECTING",
            1: "OPEN",
            2: "CLOSING",
            3: "CLOSED",
        };
        console.log(
            "[WebSocket] Status:",
            statusMap[readyState as keyof typeof statusMap]
        );
    }, [readyState]);

    const contextValue = {
        readyState,
        rescuerLocation,
        sendJsonMessage,
    };

    return (
        <UserSocketContext.Provider value={contextValue}>
            {children}
        </UserSocketContext.Provider>
    );
};

export const useUserSocket = () => {
    const context = useContext(UserSocketContext);
    if (context === undefined) {
        throw new Error(
            "useUserSocket musi być używany wewnątrz UserSocketProvider"
        );
    }
    return context;
};
