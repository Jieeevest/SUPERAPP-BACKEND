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
  server.get(
    "/:id/contracts",
    { preHandler: [checkSession] },
    getTeamContracts
  );
  server.get(
    "/:id/contracts/:contractId",
    { preHandler: [checkSession] },
    getTeamContractById
  );
  server.post(
    "/:id/contracts",
    { preHandler: [checkSession] },
    createTeamContract
  );
  server.put(
    "/:id/contracts/:contractId",
    { preHandler: [checkSession] },
    updateTeamContract
  );
  server.delete(
    "/:id/contracts/:contractId",
    { preHandler: [checkSession] },
    deleteTeamContract
  );
}

export default teamRoutes;
