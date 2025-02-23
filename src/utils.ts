import QRCode from "qrcode";

import { networkInterfaces } from "os";

import fs from "fs";
import path from "path";

export function generateSecureRandomSixDigitNumber(): string {
  const crypto = require("crypto"); // Import the crypto module

  const randomNumber = crypto.randomInt(0, 1000000); // Generates a random int between 0 and 999999

  const paddedNumber = randomNumber.toString().padStart(6, "0");

  return paddedNumber;
}

export async function sendQRCodeViaWebSocket(
  ws: any,
  url: string,
  otp: string,
  clients: any,
) {
  //  ws type could be more specific if you have a WS type defined

  // const qrAuthUrl = `${url}/qr-login?session=${sessionId}`;

  try {
    const qrCodeDataURL = await QRCode.toDataURL(url);
    // Send the QR code data URL as a JSON message
    //
    //
    SendToallWs(clients, { type: "qrCode", data: qrCodeDataURL, otp: otp });
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    // Send an error message via WebSocket
    SendToallWs(clients, {
      type: "error",
      message: "Failed to generate QR code.",
    });
  }
}

export function SendToallWs(clients: any, data: any) {
  clients.forEach((client: any) => {
    if (client.readyState === WebSocket.OPEN) {
      // Check if client is still connected

      client.send(JSON.stringify(data));
    } else {
      clients.delete(client); // Remove disconnected clients
    }
  });
}

export async function saveDataToFile(
  filename: string,
  body: string | File,
  type: string,
  sendWs: boolean = false,

  clients: any = null,
): Promise<Response> {
  try {
    let filePath: string;
    const basedir = path.join(process.cwd(), "data"); // Use process.cwd() for better reliability
    // await fs.promises.mkdir(dataDir, { recursive: true });
    // await Bun.write(path.join(dataDir), "");
    if (type === "file") {
      const dataDir = path.join(basedir, "file"); // Use process.cwd() for better reliability
      await fs.promises.mkdir(dataDir, { recursive: true });
      // await Bun.write(path.join(dataDir), "");

      filePath = path.join(dataDir, filename);
      const fileBuffer = await (body as File).arrayBuffer();

      await Bun.write(filePath, fileBuffer);
    } else {
      filePath = path.join(basedir, filename);
      await Bun.write(filePath, body);
    }

    if (sendWs) {
      console.log(clients);
      SendToallWs(clients, {
        type: "recieve-chat",
        data: { type: "file", data: filePath, id: Date.now() },
      });
    }
    return new Response("success", { status: 200 }); // Success
  } catch (err) {
    console.error("Error saving data:", err); // Log the error for debugging
    if (err instanceof Error) {
      console.error("Error saving data:", err); // Log the error for debugging
      return new Response(err.message, { status: 500 }); // Internal Server Error
    } else {
      console.error("Error saving data:", err); // Log the error for debugging
      return new Response("An unexpected error occurred", { status: 500 });
    }
  }
}

export function getLocalIPAddress(): string | null {
  const interfaces = networkInterfaces();
  let ipAddress: string;

  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];

    if (interfaceInfo) {
      for (const iface of interfaceInfo) {
        if (iface.family === "IPv4" && !iface.internal) {
          return (ipAddress = iface.address);
        }
      }
    }
  }
  return null;
}

export async function serveFile(filename: string): Promise<Response> {
  if (!filename) {
    return new Response("Missing filename parameter", { status: 400 });
  }

  try {
    const filePath = `${filename}`; // Example: Files in an 'uploads' directory
    console.log(filePath);

    const fileExists = Bun.file(filePath).exists(); // Elysia uses Bun's file system
    if (!fileExists) {
      return new Response("File not found", { status: 404 });
    }

    const file = Bun.file(filePath);
    return new Response(file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
