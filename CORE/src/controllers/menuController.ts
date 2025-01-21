/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { sendResponse } from "../helpers";

const prisma = new PrismaClient();

export const getMenus = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    /** Get filter parameters */
    // const { name, description } = request.query as {
    //   name?: string;
    //   description?: string;
    // };

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
        status: {
          contains: "active",
          mode: "insensitive",
          not: "non-active",
        },
      },
    };

    // if (name) whereConditions.name = name;
    // if (description) whereConditions.description = description;

    /** Fetch menus */
    const menu = await prisma.menu.findMany({
      ...options,
      ...whereConditions,
    });

    /** Count menus */
    const menuCount = await prisma.menu.count({
      ...whereConditions,
    });

    /** Send response */
    return sendResponse(reply, 200, {
      success: true,
      message: "Menu fetched successfully",
      data: {
        menu,
        totalData: menuCount,
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

export const getMenuById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  try {
    const menuId = parseInt(id);
    const menu = await prisma.menu.findUnique({
      where: {
        id: menuId,
        status: {
          contains: "active",
          mode: "insensitive",
          not: "non-active",
        },
      },
    });

    if (!menu) {
      return sendResponse(reply, 404, {
        success: false,
        message: "Menu not found",
        data: null,
      });
    }
    return sendResponse(reply, 200, {
      success: true,
      message: "Menu fetched successfully",
      data: menu,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
      success: false,
      message: "Error fetching menu",
      error: error,
    });
  }
};

export const createMenu = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const {
    name,
    description,
    urlMenu,
    iconMenu,
    category,
    orderingNumber,
    parentMenu,
  } = request.body as {
    name: string;
    description?: string;
    urlMenu?: string;
    iconMenu?: string;
    category?: string;
    orderingNumber?: number;
    parentMenu?: any;
  };

  try {
    const newMenu = await prisma.menu.create({
      data: {
        name,
        description,
        urlMenu,
        iconMenu,
        category,
        orderingNumber,
        parentMenu,
        status: "active",
      },
    });
    return sendResponse(reply, 201, {
      success: true,
      message: "Menu created successfully",
      data: newMenu,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
      success: false,
      message: "Error creating menu",
      error: error,
    });
  }
};

export const updateMenu = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const menuId = parseInt(id);
  const {
    name,
    description,
    urlMenu,
    iconMenu,
    category,
    orderingNumber,
    parentMenu,
  } = request.body as {
    name?: string;
    description?: string;
    urlMenu?: string;
    iconMenu?: string;
    category?: string;
    orderingNumber?: number;
    parentMenu?: any;
  };

  try {
    const existingMenu = await prisma.menu.findUnique({
      where: {
        id: menuId,
        status: {
          contains: "active",
          mode: "insensitive",
          not: "non-active",
        },
      },
    });
    if (!existingMenu) {
      return sendResponse(reply, 404, {
        success: false,
        message: "Menu not found",
        data: null,
      });
    }
    const updatedMenu = await prisma.menu.update({
      where: { id: menuId },
      data: {
        name,
        description,
        urlMenu,
        iconMenu,
        category,
        orderingNumber,
        parentMenu,
      },
    });
    return sendResponse(reply, 200, {
      success: true,
      message: "Menu updated successfully",
      data: updatedMenu,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
      success: false,
      message: "Error updating menu",
      error: error,
    });
  }
};

export const deleteMenu = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  try {
    const menuId = parseInt(id);
    const existingMenu = await prisma.menu.findUnique({
      where: {
        id: menuId,
        status: {
          contains: "active",
          mode: "insensitive",
          not: "non-active",
        },
      },
    });
    if (!existingMenu) {
      return sendResponse(reply, 404, {
        success: false,
        message: "Menu not found",
        data: null,
      });
    }
    const deletedMenu = await prisma.menu.update({
      where: { id: menuId },
      data: {
        status: "non-active",
      },
    });
    // const deletedMenu = await prisma.menu.delete({
    //   where: { id },
    // });
    return sendResponse(reply, 200, {
      success: true,
      message: "Menu deleted successfully",
      data: deletedMenu,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
      success: false,
      message: "Error deleting menu",
      error: error,
    });
  }
};
