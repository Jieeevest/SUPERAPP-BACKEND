/* eslint-disable @typescript-eslint/no-explicit-any */
import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: any; // Replace `any` with the actual type of `user` if known
  }
}
