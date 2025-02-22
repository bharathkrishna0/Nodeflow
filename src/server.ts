import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { cookie } from "@elysiajs/cookie";
import { v4 as uuidv4 } from "uuid";
import open from "open";
import {
  sendQRCodeViaWebSocket,
  generateSecureRandomSixDigitNumber,
  SendToallWs,
} from "./utils";
("./utils.ts");
import path from "path";

let Serverhostname: string = "";
let Serverport: number = 0;
let validOTP: string | null = null;
const authenticatedSessions = new Set<string>();
const requestLogger = () => (app: Elysia) =>
  app.onRequest((context) => {
    const timestamp = new Date().toISOString();
    const method = context.request.method;
    const url = context.request.url; // Or context.url for pathname only
    // console.log(`[HTTP Request - ${timestamp}] ${method} ${url}`); // Log method and full URL
  });
const clients = new Set();

const app = new Elysia()
  .use(cookie())
  .use(requestLogger())
  .use(
    staticPlugin({
      assets: path.resolve("./frontend/dist"),
      prefix: "/", // Serve static files from root, adjust prefix if needed
    }),
  )
  .get("/", async (context) => {
    const sessionId = context.cookie.sessionId.value;
    // console.log(sessionId);
    if (sessionId && authenticatedSessions.has(sessionId)) {
      // User is authenticated, serve index.html
      return Bun.file(path.resolve("./frontend/dist/index.html"));
    } else {
      // Not authenticated, redirect to auth.html
      return context.redirect("./auth");
    }
  })
  .get("/auth", async () => {
    return Bun.file(path.resolve("./frontend/auth.html"));
    // return Bun.file("./auth.html");
  })
  .get("/qr-login", async (context) => {
    // Extract the session ID from the query parameters
    const sessionId = context.query.session;
    // const lastIndex = sessionId.lastIndexOf("session=");
    // const extractedSessionId = sessionId.substring(lastIndex + 8); // "sess
    // console.log(sessionId, "qrlogin");

    if (sessionId && authenticatedSessions.has(sessionId)) {
      console.log("qrlogin sucessful");
      validOTP = null;
      // Set the cookie for the user
      context.cookie.sessionId.set({
        value: sessionId,
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        // sameSite: "strict",
        path: "/",
      });

      // Redirect user to the index page
      return context.redirect("/");
    } else {
      return new Response("Invalid or expired session.", { status: 401 });
    }
  })
  .post("/auth-code", async (context) => {
    const body = await context.request.formData();
    const authCode = body.get("authCode");

    if (validOTP && authCode === validOTP) {
      const sessionId = uuidv4();
      authenticatedSessions.add(sessionId);
      context.cookie.sessionId.set({
        value: sessionId,
        httpOnly: true, // Recommended for security
        maxAge: 60 * 60 * 24 * 7, // 7 days session expiry
        sameSite: "strict", // Recommended for security
        path: "/",
      });

      return new Response(null, { status: 200 }); // Success
    } else {
      return new Response("Invalid authentication code.", { status: 401 }); // Unauthorized
    }
  })
  .ws("/ws", {
    open(ws) {
      clients.add(ws);
      console.log("WebSocket connection opened");
      // You can perform actions on connection open if needed
    },
    message(ws, message: any) {
      console.log(message);
      if (message.type === "requestAuthCode") {
        // console.log("authcode");
        const sessionId = uuidv4();
        authenticatedSessions.add(sessionId);
        const qrLoginUrl = `http://${Serverhostname}:${Serverport}/qr-login?session=${sessionId}`;
        validOTP = generateSecureRandomSixDigitNumber();
        sendQRCodeViaWebSocket(ws, qrLoginUrl, validOTP, clients);
      } else if (message.type === "chat") {
        console.log("newmessage", message.data);

        SendToallWs(clients, {
          type: "recieve-chat",
          data: { data: message.data, id: Date.now() },
        });
      } else if (message.type === "chat-file") {
        console.log("newfile", message.data);

        SendToallWs(clients, {
          type: "recieve-chat-file",
          data: { data: message.data, id: Date.now() },
        });
      }
      // console.log(`Received message: ${message}`);
      // ws.send(`Server received: ${message}`); // Echo back the message
    },
    close(ws) {
      console.log("WebSocket connection closed");
      // Perform cleanup or handle disconnection
    },
    error(ws, error) {
      console.error("WebSocket error:", error);
    },
  });
export default app;

export async function openHostBrowser(port: number, hostname: string) {
  let sessionId;
  sessionId = uuidv4();
  authenticatedSessions.add(sessionId); // Add it to authenticatedSessions
  // console.log(sessionId);

  Serverhostname = hostname;
  Serverport = port;
  // 2. Construct the *direct* qr-login URL
  const qrLoginUrl = `http://${hostname}:${port}/qr-login?session=${sessionId}`;

  // 3. Open the *qr-login* URL directly
  await open(qrLoginUrl);
}
