import { startServer } from "./src/server";

const port = 3000;
const hostname = "0.0.0.0";

startServer(port, hostname);

console.log(`Server listening on ${hostname}:${port}`);

