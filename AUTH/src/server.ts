import Fastify from "fastify";
import authenticationRoutes from "./routes/authenticationRoutes";

const server = Fastify();

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
