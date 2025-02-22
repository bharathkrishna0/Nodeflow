import app, { openHostBrowser } from "./server";

// Start the server by calling listen() on the imported app
const port = 3000;
const hostname = "0.0.0.0";
app.listen({ port: port, hostname: hostname }, () => {
  console.log(`Server started at http://${hostname}:${port}`);
});
openHostBrowser(port, hostname);

console.log(`Elysia is running on port ${app.server?.port}`);
