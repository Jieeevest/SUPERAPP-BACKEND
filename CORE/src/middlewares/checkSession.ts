/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { sendResponse } from "../helpers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const checkSession = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return sendResponse(reply, 401, {
      success: false,
      message: "Authorization header is missing",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string);

    // Menambahkan properti user ke request
    (request as any).user = decoded;

    return true;
  } catch (error) {
    return sendResponse(reply, 401, {
      success: false,
      message: "Invalid or expired session token",
      error,
    });
  }
};
