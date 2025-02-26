import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface WebSocketContextProps {
  children: React.ReactNode;
}

// Extend WebSocketContextValue to include auth-related data and functions
interface WebSocketContextValue {
  sendMessage: (message: string) => void;
  latestMessage: string | null;
  isConnected: boolean;
  error: Event | null;
  connect: () => void;
  disconnect: () => void;
  requestAuthCode: () => void; // Function to request auth code
  qrCodeData: string | null; // State for QR code data
  authCode: string | null; // State for one-time auth code
  connectedDevices: string[]; // Example: array of device IDs, adjust type as needed
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(
  undefined,
);

export const WebSocketProvider: React.FC<WebSocketContextProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [latestMessage, setLatestMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Event | null>(null);

  // New states for authentication data
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]); // Initialize as empty array

  // Dynamically construct the WebSocket URL
  const websocketURL = `${window.location.origin.replace(/^http/, "ws")}/ws`;

  const connect = useCallback(() => {
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      console.warn("WebSocket is already connecting or connected.");
      return;
    }

    const ws = new WebSocket(websocketURL);
    setSocket(ws);
    setIsConnected(false);
    setError(null);

    ws.onopen = () => {
      console.log("WebSocket connected to:", websocketURL);
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      setLatestMessage(String(event.data));
      setError(null);

      // **Parse incoming messages and update state based on message type**
      try {
        const messageData = JSON.parse(String(event.data));
        if (messageData.type === "qrCode") {
          setQrCodeData(messageData.data);
          setAuthCode(messageData.otp); // Clear other auth data when QR code is received
          // setConnectedDevices([]); // Clear device list as well if needed, adjust as per your logic
        } else if (messageData.type === "authCode") {
          setAuthCode(messageData.data);
          setQrCodeData(null); // Clear QR code data when auth code is received
          // setConnectedDevices([]); // Clear device list if needed
        } else if (messageData.type === "deviceList") {
          setConnectedDevices(messageData.devices); // Assuming data is an array of device IDs
          setQrCodeData(null); // Clear other auth data
          setAuthCode(null);
        }
        // Add more message type handling as needed for your application
      } catch (e) {
        console.warn("Failed to parse WebSocket message as JSON:", e);
        // Handle non-JSON messages or errors if needed
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      setIsConnected(false);
      setSocket(null);
      setError(null);
      // Clear all auth related states on disconnect as well, if that's desired behavior
      setQrCodeData(null);
      setAuthCode(null);
      setConnectedDevices([]);
    };

    ws.onerror = (event) => {
      console.error("WebSocket error:", event);
      setIsConnected(false);
      setError(event);
      setSocket(null);
      setQrCodeData(null);
      setAuthCode(null);
      setConnectedDevices([]);
    };
  }, [websocketURL, socket]);

  const disconnect = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
      setIsConnected(false);
      console.log("WebSocket disconnect initiated by user.");
    } else if (socket) {
      console.log("WebSocket is not open, cannot disconnect.");
    } else {
      console.log("No WebSocket connection to disconnect.");
    }
  }, [socket]);

  const sendMessage = useCallback(
    (message: string) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log(message, "sending message");
        socket.send(message);
        console.log("WebSocket message sent:", message);
      } else {
        console.warn("WebSocket is not connected. Message not sent:", message);
      }
    },
    [socket],
  );

  // New function to request auth code
  const requestAuthCode = useCallback(() => {
    if (isConnected) {
      sendMessage(JSON.stringify({ type: "requestAuthCode" })); // Send a message to request auth code
      console.log("Requesting auth code from server.");
    } else {
      console.warn("WebSocket is not connected. Cannot request auth code.");
    }
  }, [isConnected, sendMessage]);

  useEffect(() => {
    console.log(window.location.hostname);
    setTimeout(() => {
      connect(); // Attempt reconnection after delay
    }, 100);

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [connect]);

  const contextValue: WebSocketContextValue = {
    sendMessage,
    latestMessage,
    isConnected,
    error,
    connect,
    disconnect,
    requestAuthCode, // Expose requestAuthCode function
    qrCodeData, // Expose qrCodeData state
    authCode, // Expose authCode state
    connectedDevices, // Expose connectedDevices state
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
