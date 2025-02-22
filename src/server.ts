import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { cookie } from "@elysiajs/cookie";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const validOTP = "123456";
const authenticatedSessions = new Set<string>();

const app = new Elysia()
  .use(cookie())
  .use(
    staticPlugin({
      assets: path.resolve("./frontend/dist"),
      prefix: "/", // Serve static files from root, adjust prefix if needed
    }),
  )
  .get("/", async (context) => {
    const sessionId = context.cookie.sessionId.value;
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
  .post("/auth-code", async (context) => {
    const body = await context.request.formData();
    const authCode = body.get("authCode");

    if (authCode === validOTP) {
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
      console.log("WebSocket connection opened");
      // You can perform actions on connection open if needed
    },
    message(ws, message) {
      console.log(`Received message: ${message}`);
      ws.send(`Server received: ${message}`); // Echo back the message
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
