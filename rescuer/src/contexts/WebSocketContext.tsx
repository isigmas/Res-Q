import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  LostPersonLocationPayload,
  MessageReceived,
} from "../types/websocketTypes";

const WEBSOCKET_URL ="wss://resq-backend-isp4g.ondigitalocean.app/ws/test/rescuer";

interface RescuerSocketContextType {
  readyState: ReadyState;
  lostPersonLocation: LostPersonLocationPayload | null;
  sendJsonMessage: (message: any) => void;
}

const RescuerSocketContext = createContext<
  RescuerSocketContextType | undefined
>(undefined);

export const RescuerSocketProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [lostPersonLocation, setLostPersonLocation] =
    useState<LostPersonLocationPayload | null>(null);

  const { sendJsonMessage, lastJsonMessage, readyState } =
    useWebSocket<MessageReceived>(WEBSOCKET_URL, {
      share: true,
      shouldReconnect: (closeEvent) => true, // Zawsze próbuj połączyć ponownie
      reconnectInterval: 3000, // Próbuj połączyć ponownie co 3 sekundy
      retryOnError: true,
    });

  useEffect(() => {
    console.log("JSON: " + lastJsonMessage?.type || null);
    if (lastJsonMessage) {
      if (lastJsonMessage.type === "tourist_location") {
        setLostPersonLocation(lastJsonMessage.data);
      }
    }
  }, [lastJsonMessage]);

  const contextValue = {
    readyState,
    lostPersonLocation,
    sendJsonMessage,
  };

  return (
    <RescuerSocketContext.Provider value={contextValue}>
      {children}
    </RescuerSocketContext.Provider>
  );
};

export const useRescuerSocket = () => {
  const context = useContext(RescuerSocketContext);
  if (context === undefined) {
    throw new Error(
      "useRescuerSocket musi być używany wewnątrz RescuerSocketProvider"
    );
  }
  return context;
};
