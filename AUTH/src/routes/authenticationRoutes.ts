import { FastifyInstance } from "fastify";
import {
  getCurrentUser,
  login,
  resetPassword,
  forgetPassword,
  updateProfile,
} from "../controllers/authController";
import { checkSession } from "../middlewares/checkSession";

async function authenticationRoutes(server: FastifyInstance) {
  server.get("/", { preHandler: [checkSession] }, getCurrentUser);
  server.post("/", login);
  server.post("/reset-password", resetPassword);
  server.post("/forget-password", forgetPassword);
  server.put("/update-profile", { preHandler: [checkSession] }, updateProfile);
}

export default authenticationRoutes;
