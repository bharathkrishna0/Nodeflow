import QRCode from "qrcode";
// Function to generate and send the QR code data URL via WebSocket
export function createAuthUrl(sessionId: string, url: string): string {
  //  ws type could be more specific if you have a WS type defined
  // authenticatedSessions.add(sessionId);

  const authUrl = `${url}/qr-login?session=${sessionId}`;

  // Send the QR code data URL as a JSON message
  return authUrl;
}
// Function to generate and send the QR code data URL via WebSocket
export async function sendQRCodeViaWebSocket(
  ws: any,
  context: any,
  sessionId: string,
) {
  //  ws type could be more specific if you have a WS type defined

  const qrAuthUrl = `${context.request.url.origin}/qr-login?session=${sessionId}`;

  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrAuthUrl);
    // Send the QR code data URL as a JSON message
    ws.send(JSON.stringify({ type: "qrCode", data: qrCodeDataURL }));
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    // Send an error message via WebSocket
    ws.send(
      JSON.stringify({ type: "error", message: "Failed to generate QR code." }),
    );
  }
}
