import { FastifyInstance } from "fastify";
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  verifyMember,
} from "../controllers/memberController";
import { checkSession } from "../middlewares/checkSession";

async function memberRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [checkSession] }, getMembers);
  fastify.get("/:id", { preHandler: [checkSession] }, getMemberById);
  fastify.post("/", { preHandler: [checkSession] }, createMember);
  fastify.put("/:id", { preHandler: [checkSession] }, updateMember);
  fastify.delete("/:id", { preHandler: [checkSession] }, deleteMember);

  fastify.put("/verify/:id", { preHandler: [checkSession] }, verifyMember);
}

export default memberRoutes;
