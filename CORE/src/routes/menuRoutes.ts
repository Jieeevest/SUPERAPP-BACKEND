import { FastifyInstance } from "fastify";
import {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
} from "../controllers/menuController";
import { checkSession } from "../middlewares/checkSession";

async function menuRoutes(server: FastifyInstance) {
  server.get(
    "/",
    //  { preHandler: [checkSession] },
    getMenus
  );
  server.get("/:id", { preHandler: [checkSession] }, getMenuById);
  server.post("/", { preHandler: [checkSession] }, createMenu);
  server.put("/:id", { preHandler: [checkSession] }, updateMenu);
  server.delete("/:id", { preHandler: [checkSession] }, deleteMenu);
}

export default menuRoutes;
