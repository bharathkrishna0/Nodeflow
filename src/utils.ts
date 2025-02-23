import QRCode from "qrcode";
import { stringify } from "csv-stringify";
import { networkInterfaces } from "os";
import { parse } from "csv-parse";

import fs from "fs";
import path from "path";
interface MessageData {
  type: string;
  data: string;
  id: number;
}

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

export function appendToHistoryCSV(data: MessageData): void {
  const filename = "historyfile.csv";

  const basedir = path.join(process.cwd(), "data"); // Use process.cwd() for better reliability
  const filepath = path.join(basedir, filename);
  // console.log(data, data.type, data.data, data.id);

  const dataToAppend = [
    data.type,
    data.data,
    data.id, // Data as an array for csv-stringify
  ];

  try {
    // Check if the file exists. If not, write the header row.
    const fileExists = fs.existsSync(filepath);
    const csvStringifier = stringify({
      header: !fileExists, // Write header only if file doesn't exist
      columns: ["type", "data", "id"], // Define columns for the header
    });

    csvStringifier.on("error", (err) => {
      console.error("CSV stringify error:", err);
    });

    csvStringifier.on("data", (output) => {
      fs.appendFileSync(filepath, output, { encoding: "utf8" });
    });

    csvStringifier.write(dataToAppend);
    csvStringifier.end();

    console.log(`Successfully appended to ${filename}`);
  } catch (err) {
    console.error(`Error appending to ${filename}:`, err);
  }
}

export async function readFromHistoryCSV(): Promise<MessageData[]> {
  const basedir = path.join(process.cwd(), "data");
  const filename = "historyfile.csv";
  const filepath = path.join(basedir, filename);

  try {
    if (!fs.existsSync(filepath)) {
      console.log(`File ${filename} not found. Returning empty array.`);
      return [];
    }

    const fileContent = fs.readFileSync(filepath, { encoding: "utf8" });

    return new Promise<MessageData[]>((resolve, reject) => {
      const results: MessageData[] = []; // Crucial: Inside the Promise

      parse(
        fileContent,
        {
          columns: true,
          skip_empty_lines: true,
        },
        (err, records) => {
          if (err) {
            console.error("Error parsing CSV:", err);
            return reject(err); // Reject on error
          }

          if (records) {
            // Check if records is defined
            records.forEach((record: any) => {
              const messageData: MessageData = {
                type: record.type,
                data: record.data,
                id: record.id,
              };
              console.log(messageData);
              results.push(messageData);
            });
          }

          resolve(results); // Resolve with the results
        },
      );
    });
  } catch (err) {
    console.error(`Error reading from ${filename}:`, err);
    return []; // Return empty array on file read error
  }
}
