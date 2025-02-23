import app, { openHostBrowser } from "./server";
import { getLocalIPAddress } from "./utils";

// Start the server by calling listen() on the imported app
const port = 3000;
const hostname = getLocalIPAddress() as string;
if (!hostname) {
  console.log("failed running hostname cant be resolved");
}
app.listen({ port: port, hostname: hostname }, () => {
  console.log(`Server started at http://${hostname}:${port}`);
});
openHostBrowser(port, hostname);
// ip_address.ts

console.log(`Elysia is running on port ${app.server?.port}`);
