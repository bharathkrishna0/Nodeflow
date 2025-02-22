// src/server.ts
import { serve } from "bun";
import type { ServerWebSocket } from "bun";
import * as path from "path";
import { parse } from "url";
import fs from "fs";

const frontendDir = path.join(import.meta.dir, "../frontend/dist");

// --- Define the type for ws.data ---
interface MyWebSocketData {
  deviceId: string;
}

// --- Authentication and Device Management ---
// Use the defined type in connectedDevices
let connectedDevices: {
  id: string;
  ws: ServerWebSocket<MyWebSocketData>;
  name: string;
}[] = [];
let authCode: string | null = null;
let webSocketServer: ReturnType<typeof serve> | null = null; // Store the server instance

const generateAuthCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getLocalIpAddress = () => {
  const interfaces = require("os").networkInterfaces();
  for (const interfaceName in interfaces) {
    const iface = interfaces[interfaceName];
    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }
  return "localhost";
};

// --- Helper Functions ---

function checkAuth(cookies: string | null): boolean {
  if (!cookies) {
    return false;
  }

  const parsedCookies: { [key: string]: string | undefined } = cookies
    .split(";")
    .reduce((acc: { [key: string]: string | undefined }, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key) {
        // Ensure the key exists
        acc[key] = value;
      }
      return acc;
    }, {});

  const deviceId = parsedCookies["deviceId"];
  // Check if deviceId is defined AND is a string
  return (
    typeof deviceId === "string" &&
    connectedDevices.some((device) => device.id === deviceId)
  );
}

function updateConnectedDevices() {
  // Removed ws parameter
  const devicesData = connectedDevices.map((device) => ({
    id: device.id,
    name: device.name, // Make sure you have a 'name' property
  }));
  if (webSocketServer) {
    webSocketServer.publish(
      "room",
      JSON.stringify({
        type: "devicesUpdate",
        payload: devicesData,
      }),
    );
  }
}

function handleRemoveDevice(deviceId: string) {
  removeDeviceFromList(deviceId);
}
function removeDeviceFromList(deviceId: string) {
  connectedDevices = connectedDevices.filter(
    (device) => device.id !== deviceId,
  );
  updateConnectedDevices(); // Update all clients
}
// --- WebSocket Message Handlers ---

function handleAuthCodeRequest(ws: ServerWebSocket<MyWebSocketData>) {
  authCode = generateAuthCode();
  const ipAddress = getLocalIpAddress();
  const qrCodeData = `http://${ipAddress}:${webSocketServer?.port}/auth?code=${authCode}`;

  if (webSocketServer) {
    webSocketServer.publish(
      "room",
      JSON.stringify({
        type: "authCode",
        payload: { code: authCode, qrCode: qrCodeData },
      }),
    );
  }
  updateConnectedDevices(); // Update device list after generating code
}

export function startServer(port: number, hostname: string) {
  const server = serve({
    port,
    hostname,
    fetch(req, server) {
      const url = new URL(req.url);
      console.log("Incoming request:", req.method, url.pathname);
      const frontendDir = path.join(import.meta.dir, "../frontend/dist");
      if (server.upgrade(req, { data: { deviceId: "" } })) {
        console.log(" server upgrade");
        return;
      }

      // 1. Serve Static Assets (Correctly Handle Paths)
      if (url.pathname === "/" || url.pathname.startsWith("/assets/")) {
        let filePath = url.pathname === "/" ? "index.html" : url.pathname;
        const fullPath = path.join(frontendDir, filePath);

        if (fs.existsSync(fullPath)) {
          const file = Bun.file(fullPath);
          return new Response(file);
        }
      }
      // console.log("Attempting WebSocket upgrade..."); // Log BEFORE upgrade

      // 2. WebSocket Upgrade

      // 3. Authentication Check (BEFORE serving index.html)
      const cookies = req.headers.get("cookie");
      const isAuthenticated = checkAuth(cookies);
      if (!isAuthenticated && url.pathname !== "/auth") {
        return Response.redirect(`${url.origin}/auth`, 302);
      }

      // 4. Fallback to index.html for SPA Routing
      const indexFilePath = path.join(frontendDir, "index.html");
      if (fs.existsSync(indexFilePath)) {
        const indexFile = Bun.file(indexFilePath);
        return new Response(indexFile, {
          headers: {
            "Content-Type": "text/html",
          },
        });
      } else {
        return new Response("index.html not found", { status: 500 });
      }
    },
    websocket: {
      open(ws: ServerWebSocket<MyWebSocketData>) {
        // Use the defined type here
        console.log("Client connected");
        ws.subscribe("room");

        // Assign a unique ID to the device
        const deviceId = crypto.randomUUID();
        ws.data.deviceId = deviceId; // Now this is valid
        connectedDevices.push({
          id: deviceId,
          ws,
          name: `Device-${deviceId.substring(0, 8)}`,
        });
        updateConnectedDevices();
      },
      message(ws, message) {
        try {
          let parsedMessage;
          if (typeof message === "string") {
            parsedMessage = JSON.parse(message);
          } else {
            parsedMessage = JSON.parse(new TextDecoder().decode(message));
          }

          switch (parsedMessage.type) {
            case "requestAuthCode":
              handleAuthCodeRequest(ws);
              break;
            case "removeDevice":
              handleRemoveDevice(parsedMessage.payload);
              break;
          }
        } catch (error) {
          console.error("Invalid message", message, error);
        }
      },
      close(ws: ServerWebSocket<MyWebSocketData>) {
        // Use the defined type here
        console.log("Client disconnected");
        const deviceId = ws.data.deviceId; // Now this is valid and typesafe
        removeDeviceFromList(deviceId);
      },
    },
  });

  webSocketServer = server; // Store the server instance
  return server;
}
