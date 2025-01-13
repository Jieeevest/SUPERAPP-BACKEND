import Fastify from "fastify";
import teamRoutes from "./routes/teamRoutes";
import roleRoutes from "./routes/roleRoutes";
import menuRoutes from "./routes/menuRoutes";
import packageRoutes from "./routes/packageRoutes";
import { memberRoutes } from "./routes/memberRoutes";

const server = Fastify();
// {logger: true}

const prefix = "/api";

server.register(teamRoutes, { prefix: prefix + "/teams" });
server.register(memberRoutes, { prefix: prefix + "/members" });
server.register(roleRoutes, { prefix: prefix + "/roles" });
server.register(menuRoutes, { prefix: prefix + "/menu" });
server.register(packageRoutes, { prefix: prefix + "/packages" });

const start = async () => {
  try {
    await server.listen({ port: (process.env.PORT || 3000) as number });
    console.log(`Server listening on port ${process.env.PORT || 3000}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
