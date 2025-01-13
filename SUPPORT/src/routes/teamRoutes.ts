import { FastifyInstance } from "fastify";
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamContracts,
  getTeamContractById,
  createTeamContract,
  updateTeamContract,
  deleteTeamContract,
} from "../controllers/teamController";
import { checkSession } from "../middlewares/checkSession";

async function teamRoutes(server: FastifyInstance) {
  // Team Routes
  server.get("/", { preHandler: [checkSession] }, getTeams);
  server.get("/:id", { preHandler: [checkSession] }, getTeamById);
  server.post("/", { preHandler: [checkSession] }, createTeam);
  server.put("/:id", { preHandler: [checkSession] }, updateTeam);
  server.delete("/:id", { preHandler: [checkSession] }, deleteTeam);

  // Team Contracts Routes
  server.get("/contracts", { preHandler: [checkSession] }, getTeamContracts);
  server.get(
    "/contracts/:id",
    { preHandler: [checkSession] },
    getTeamContractById
  );
  server.post("/contracts", { preHandler: [checkSession] }, createTeamContract);
  server.put(
    "/contracts/:id",
    { preHandler: [checkSession] },
    updateTeamContract
  );
  server.delete(
    "/contracts/:id",
    { preHandler: [checkSession] },
    deleteTeamContract
  );
}

export default teamRoutes;
