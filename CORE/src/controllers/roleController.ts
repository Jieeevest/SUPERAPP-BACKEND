/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { sendResponse } from "../helpers";

const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

export const getRoles = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    /** Get filter parameters */
    const { name, description } = request.query as {
      name?: string;
      description?: string;
    };

    /** Get query parameters */
    const { page, limit, sortBy, sortOrder } = request.query as {
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    /** Set pagination parameters */
    const pageNumber = parseInt(page || "1", 10);
    const pageSize = parseInt(limit || "10", 10);
    const orderField = sortBy || "createdAt";
    const orderDirection = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

    /** Set options */
    const options = {
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy: { [orderField]: orderDirection },
    };

    /** Filter parameters */
    const whereConditions: any = {
      where: {
        status: "active",
        name: {
          contains: name,
          mode: "insensitive",
        },
        description: {
          contains: description,
          mode: "insensitive",
        },
      },
    };

    if (name) whereConditions.name = name;
    if (description) whereConditions.description = description;

    /** Fetch roles */
    const roles = await prisma.role.findMany({
      ...options,
      ...whereConditions,
    });

    /** Count roles */
    const roleCount = await prisma.role.count({
      ...whereConditions,
    });

    /** Send response */
    return sendResponse(reply, 200, {
      success: true,
      message: "Roles fetched successfully",
      data: {
        roles,
        totalData: roleCount,
        pageNumber,
        pageSize,
        orderBy: orderField,
        orderDirection,
      },
    });
  } catch (error) {
    /** Send error response */
    return sendResponse(reply, 500, {
      success: false,
      message: "Error fetching roles",
      error: error,
    });
  }
};

export const getRoleById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  /** Get role ID from params */
  const { id } = request.params as { id: string };
  try {
    /** Validate and get role by ID */
    const validatedRole = await _validateRoleId(id, reply);

    /** If validation fails, exit early */
    if (!validatedRole) throw new Error("Role not found");

    /** Send response */
    return sendResponse(reply, 200, {
      success: true,
      message: "Role fetched successfully",
      data: validatedRole.role,
    });
  } catch (error) {
    /** Send error response */
    return sendResponse(reply, 500, {
      success: false,
      message: "Error fetching role",
      error: error,
    });
  }
};

export const createRole = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    /** Get request body */
    const { name, description, authorizedMenu } = request.body as {
      name: string;
      description?: string;
      authorizedMenu?: any;
    };

    /** Validate parameters */
    const validated = _validateParameters(name, description, authorizedMenu);

    if (!validated) {
      return sendResponse(reply, 400, {
        success: false,
        message: "Invalid parameters",
      });
    }

    /** Process and create new role */
    const newRole = await prisma.role.create({
      data: {
        name,
        description,
        authorizedMenu,
        status: "active",
      },
    });

    /** Send response */
    return sendResponse(reply, 201, {
      success: true,
      message: "Role created successfully",
      data: newRole,
    });
  } catch (error) {
    /** Send error response */
    sendResponse(reply, 500, {
      success: false,
      message: "Error creating role",
      error: error,
    });
  }
};

export const updateRole = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const { name, description, authorizedMenu } = request.body as {
    name?: string;
    description?: string;
    authorizedMenu?: any;
  };
  try {
    // Validate and get role by ID
    const validatedRole = await _validateRoleId(id, reply);
    if (!validatedRole) return; // If validation fails, exit early

    /** Validate parameters */
    const validated = _validateParameters(name, description, authorizedMenu);

    if (!validated) {
      return sendResponse(reply, 400, {
        success: false,
        message: "Invalid parameters",
      });
    }

    const updatedRole = await prisma.role.update({
      where: { id: validatedRole.roleId },
      data: {
        name,
        description,
        authorizedMenu,
      },
    });
    return sendResponse(reply, 200, {
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
      success: false,
      message: "Error updating role",
      error: error,
    });
  }
};

export const deleteRole = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  try {
    /** Validate and get role by ID */
    const validatedRole = await _validateRoleId(id, reply);

    /** If validation fails, exit early */
    if (!validatedRole) return;

    const deletedRole = await prisma.role.update({
      data: { status: "non-active" },
      where: { id: validatedRole.roleId },
    });

    // const deletedRole = await prisma.role.delete({
    //   where: { id: validatedRole.roleId },
    // });

    sendResponse(reply, 200, {
      success: true,
      message: "Role deleted successfully",
      data: deletedRole,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error deleting role",
      error: error,
    });
  }
};

const _validateRoleId = async (
  id: string,
  reply: FastifyReply
): Promise<{ roleId: number; role: any } | null> => {
  const roleId = parseInt(id);
  if (isNaN(roleId)) {
    sendResponse(reply, 400, {
      success: false,
      message: "Invalid ID format",
    });
    return null;
  }

  try {
    const role = await prisma.role.findUnique({
      where: { id: roleId, status: "active" },
    });

    if (!role) {
      sendResponse(reply, 404, {
        success: false,
        message: "Role not found",
      });
      return null;
    }

    return { roleId, role };
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error validating role ID",
      error: error,
    });
    return null;
  }
};

const _validateParameters = (
  name?: string,
  description?: string,
  authorizedMenu?: any
) => {
  let errors = [];
  if (!name) {
    errors.push("Name is required");
  }
  if (!description) {
    errors.push("Description is required");
  }
  if (!authorizedMenu) {
    errors.push("Authorized menu is required");
  }

  if (errors.length > 0) {
    return false;
  }
  return true;
};
