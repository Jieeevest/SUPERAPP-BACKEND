/* eslint-disable @typescript-eslint/no-explicit-any */
// src/helpers/responseHelper.ts
import { FastifyReply } from "fastify";

interface ResponseData {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export const sendResponse = (
  reply: FastifyReply,
  statusCode: number,
  responseData: ResponseData
) => {
  const { success, message, data = null, error = null } = responseData;
  reply.status(statusCode).send({
    success,
    message,
    data,
    error,
  });
};
