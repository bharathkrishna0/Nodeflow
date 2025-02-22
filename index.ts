import { startServer, OpeninHost } from "./src/server";

const port = 3000;
const hostname = "0.0.0.0";

startServer(port, hostname);
OpeninHost(port, hostname);
