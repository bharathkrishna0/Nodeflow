import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// --- Define Message Types ---
interface AuthCodeMessage {
  type: "authCode";
  payload: {
    code: string;
    qrCode: string;
  };
}

interface DevicesUpdateMessage {
  type: "devicesUpdate";
  payload: { id: string; name: string }[];
}

interface RequestAuthCodeMessage {
  type: "requestAuthCode";
  // No payload needed for this message type
}

interface RemoveDeviceMessage {
  type: "removeDevice";
  payload: string;
}

// Union type
type Message =
  | AuthCodeMessage
  | DevicesUpdateMessage
  | RequestAuthCodeMessage
  | RemoveDeviceMessage;

// --- WebSocketContextType ---
interface WebSocketContextType {
  ws: WebSocket | null;
  messages: Message[];
  sendMessage: (message: Message) => void;
  isConnected: boolean;
  authCode: string;
  qrCodeData: string;
  requestAuthCode: () => void;
  connectedDevices: { id: string; name: string }[];
  removeDevice: (deviceId: string) => void;
}

// Create the context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// WebSocketProvider component
export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [authCode, setAuthCode] = useState<string>("");
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [connectedDevices, setConnectedDevices] = useState<
    { id: string; name: string }[]
  >([]);

  const url = `ws://${window.location.hostname}:3000`;
  // const url = `ws://192.168.1.3:3000`;

  const connect = useCallback(() => {
    const newWs = new WebSocket(url);
    console.log(newWs);

    newWs.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    newWs.onmessage = (event) => {
      const message = JSON.parse(event.data) as Message;
      setMessages((prevMessages) => [...prevMessages, message]);

      // Handle different message types
      switch (message.type) {
        case "authCode":
          setAuthCode(message.payload.code);
          setQrCodeData(message.payload.qrCode);
          break;
        case "devicesUpdate":
          setConnectedDevices(message.payload);
          break;
        // ... other cases ...
      }
    };

    newWs.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setTimeout(connect, 5000);
    };

    newWs.onerror = (error) => {
      console.error("WebSocket error:", error);
      newWs.close();
      setTimeout(connect, 5000);
    };

    setWs(newWs);
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    (message: Message) => {
      if (ws && isConnected) {
        ws.send(JSON.stringify(message));
      } else {
        console.log("not connected");
      }
    },
    [ws, isConnected],
  );

  const requestAuthCode = useCallback(() => {
    sendMessage({ type: "requestAuthCode" });
  }, [sendMessage]);

  const removeDevice = useCallback(
    (deviceId: string) => {
      sendMessage({ type: "removeDevice", payload: deviceId });
    },
    [sendMessage],
  );

  const contextValue: WebSocketContextType = {
    ws,
    messages,
    sendMessage,
    isConnected,
    authCode,
    qrCodeData,
    requestAuthCode,
    connectedDevices,
    removeDevice,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
