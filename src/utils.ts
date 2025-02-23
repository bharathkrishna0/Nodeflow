import QRCode from "qrcode";

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

function saveDataToFile(message: {
  name: string;
  data: string;
}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!message.name) {
      reject(new Error("Message name is missing!"));
      return;
    }

    const filename = `${message.name}.txt`;
    const filePath = path.join(__dirname, "data", filename);

    fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });

    fs.writeFile(filePath, message.data, { encoding: "utf8" }, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Data saved to ${filePath}`);
        resolve();
      }
    });
  });
}
