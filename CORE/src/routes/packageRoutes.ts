import { FastifyInstance } from "fastify";
import {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} from "../controllers/packageController";
import { checkSession } from "../middlewares/checkSession";

async function packageRoutes(server: FastifyInstance) {
  server.get("/", { preHandler: [checkSession] }, getPackages);
  server.get("/:id", { preHandler: [checkSession] }, getPackageById);
  server.post("/", { preHandler: [checkSession] }, createPackage);
  server.put("/:id", { preHandler: [checkSession] }, updatePackage);
  server.delete("/:id", { preHandler: [checkSession] }, deletePackage);
}

export default packageRoutes;
