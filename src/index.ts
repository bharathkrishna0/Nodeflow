import app from "./server";

// Start the server by calling listen() on the imported app
const port = 3000;
const hostname = "0.0.0.0";
app.listen({ port: port, hostname: hostname }, () => {
  console.log(`Server started at http://${hostname}:${port}`);
});

console.log(`Elysia is running on port ${app.server?.port}`);
