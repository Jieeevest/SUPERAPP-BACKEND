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

server.register(authenticationRoutes, { prefix: "api/auth" });

const start = async () => {
  try {
    await server.listen({ port: (process.env.PORT || 3000) as number });
    console.log(`Server listening on port ${process.env.PORT || 3000}`);
  } catch (err) {
    server.log.error(err);
  }
};

start();
