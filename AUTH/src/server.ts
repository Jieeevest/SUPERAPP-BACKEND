import Fastify from "fastify";
import cors from "@fastify/cors";
import authenticationRoutes from "./routes/authenticationRoutes";

const server = Fastify();

// Register CORS middleware
server.register(cors, {
  origin: "*", // Allow all origins (not recommended in production)
  methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
});
server.get("/", function () {
  return "Hello world!";
});
server.register(authenticationRoutes, { prefix: "api/auth" });

const start = async () => {
  try {
    // Set host to 0.0.0.0 and port to process.env.PORT or 3000
    await server.listen({
      host: "0.0.0.0",
      port: Number(process.env.PORT) || 3000,
    });
    console.log(`Server listening on port ${process.env.PORT || 3000}`);
  } catch (err) {
    server.log.error(err);
  }
};

start();
