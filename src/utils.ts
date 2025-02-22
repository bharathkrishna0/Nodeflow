import QRCode from "qrcode";
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
    clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN) {
        // Check if client is still connected

        client.send(
          JSON.stringify({ type: "qrCode", data: qrCodeDataURL, otp: otp }),
        );
      } else {
        clients.delete(client); // Remove disconnected clients
      }
    });

    ws.send(JSON.stringify({ type: "qrCode", data: qrCodeDataURL, otp: otp }));
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    // Send an error message via WebSocket
    clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN) {
        // Check if client is still connected

        client.send(
          JSON.stringify({
            type: "error",
            message: "Failed to generate QR code.",
          }),
        );
      } else {
        clients.delete(client); // Remove disconnected clients
      }
    });
  }
}
