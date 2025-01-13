import { PrismaClient } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { sendResponse } from "../helpers";

const prisma = new PrismaClient();

export const getPackages = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const packages = await prisma.package.findMany({
      where: { status: "active" },
    });

    if (packages.length === 0) {
      return sendResponse(reply, 404, {
        success: false,
        message: "Packages not found",
        data: [],
      });
    }

    return sendResponse(reply, 200, {
      success: true,
      message: "Packages fetched successfully",
      data: packages,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
      success: false,
      message: "Error fetching packages",
      error: error,
    });
  }
};

export const getPackageById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  try {
    const packageId = parseInt(id);
    const packageData = await prisma.package.findUnique({
      where: {
        id: packageId,
        status: {
          contains: "active",
          mode: "insensitive",
          not: "non-active",
        },
      },
    });

    if (!packageData) {
      return sendResponse(reply, 404, {
        success: false,
        message: "Package not found",
        data: null,
      });
    }

    return sendResponse(reply, 200, {
      success: true,
      message: "Package fetched successfully",
      data: packageData,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
      success: false,
      message: "Error fetching package",
      error: error,
    });
  }
};

export const createPackage = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { name, description, imageUrl, selectedMenu } = request.body as {
    name: string;
    description?: string;
    imageUrl?: string;
    selectedMenu: number[];
  };

  try {
    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        imageUrl,
        selectedMenu,
        status: "active",
      },
    });
    return sendResponse(reply, 201, {
      success: true,
      message: "Package created successfully",
      data: newPackage,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
      success: false,
      message: "Error creating package",
      error: error,
    });
  }
};

export const updatePackage = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const packageId = parseInt(id);
  const { name, description, imageUrl, selectedMenu } = request.body as {
    name?: string;
    description?: string;
    imageUrl?: string;
    selectedMenu?: number[];
  };

  try {
    const existingPackage = await prisma.package.findUnique({
      where: {
        id: packageId,
        status: {
          contains: "active",
          mode: "insensitive",
          not: "non-active",
        },
      },
    });

    if (!existingPackage) {
      return sendResponse(reply, 404, {
        success: false,
        message: "Package not found",
        data: null,
      });
    }

    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: {
        name,
        description,
        imageUrl,
        selectedMenu,
      },
    });
    return sendResponse(reply, 200, {
      success: true,
      message: "Package updated successfully",
      data: updatedPackage,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
      success: false,
      message: "Error updating package",
      error: error,
    });
  }
};

export const deletePackage = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  try {
    const packageId = parseInt(id);
    // const deletedPackage = await prisma.package.delete({
    //   where: { id: packageId },
    // });
    const existingPackage = await prisma.package.findUnique({
      where: {
        id: packageId,
        status: {
          contains: "active",
          mode: "insensitive",
          not: "non-active",
        },
      },
    });

    if (!existingPackage) {
      return sendResponse(reply, 404, {
        success: false,
        message: "Package not found",
        data: null,
      });
    }
    const deletedPackage = await prisma.package.update({
      where: { id: packageId },
      data: {
        status: "non-active",
      },
    });
    return sendResponse(reply, 200, {
      success: true,
      message: "Package deleted successfully",
      data: deletedPackage,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
      success: false,
      message: "Error deleting package",
      error: error,
    });
  }
};
