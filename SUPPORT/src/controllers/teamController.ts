import { PrismaClient } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { sendResponse } from "../helpers";
import { omit } from "lodash";

const prisma = new PrismaClient();

export const getTeams = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    /** Get query parameters */
    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "asc",
    } = request.query as {
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    /** Set pagination parameters */
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
    const orderDirection = sortOrder.toLowerCase() === "desc" ? "desc" : "asc";

    /** Set options */
    const options = {
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: orderDirection },
      include: {
        members: { include: { role: true } },
      },
      where: {
        status: "active",
      },
    };

    /** Fetch teams */
    const teams = await prisma.team.findMany(options);

    /** Sanitize the response */
    const sanitizedTeams = teams.map((team) => ({
      ...team,
      members: team.members.map((member) => ({
        ...omit(member, ["password"]),
        role: omit(member.role, ["authorizedMenu"]),
      })),
    }));

    /** Send response */
    sendResponse(reply, 200, {
      success: true,
      message: "Teams fetched successfully.",
      data: sanitizedTeams,
    });
  } catch (error) {
    /** Send error response */
    sendResponse(reply, 500, {
      success: false,
      message: "Error fetching teams.",
      error: error,
    });
  }
};

export const getTeamById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  try {
    const teamId = parseInt(id);
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        members: { include: { role: true } },
        contracts: true,
      },
    });

    const sanitizedTeam = {
      ...team,
      members: team?.members.map((member) => ({
        ...omit(member, ["password"]),
        role: omit(member.role, ["authorizedMenu"]),
      })),
    };

    sendResponse(reply, 200, {
      success: true,
      message: "Team fetched successfully",
      data: sanitizedTeam,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error fetching team",
      error: error,
    });
  }
};

export const createTeam = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const {
    teamName,
    companyName,
    hqAddress,
    managerName,
    managerEmail,
    managerPhone,
    imageUrl,
  } = request.body as {
    teamName: string;
    companyName?: string;
    hqAddress?: string;
    managerName?: string;
    managerEmail: string;
    managerPhone?: string;
    imageUrl: string;
  };
  try {
    const newTeam = await prisma.team.create({
      data: {
        teamName,
        companyName,
        hqAddress,
        managerName,
        managerEmail,
        managerPhone,
        imageUrl,
        status: "active",
      },
    });

    const generateUID = Math.random().toString(36).substring(2, 9);
    const generatePassword = String(Math.random()).substring(2, 9);
    // Transaction for creating member and member administration
    const newMember = await prisma.$transaction(async (prisma) => {
      // Create the member first
      const member = await prisma.member.create({
        data: {
          uid: generateUID,
          email: managerEmail,
          phoneNumber: managerPhone,
          name: managerName,
          password: generatePassword,
          teamId: newTeam.id,
          roleId: 1,
          status: "active",
        },
      });
      return member;
    });

    // Handle relatives creation
    sendResponse(reply, 201, {
      success: true,
      message: "Team created successfully",
      data: { ...newTeam, members: newMember },
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error creating team",
      error: error,
    });
  }
};

export const updateTeam = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const teamId = parseInt(id);
  const {
    teamName,
    companyName,
    hqAddress,
    managerName,
    managerEmail,
    managerPhone,
    imageUrl,
  } = request.body as {
    teamName: string;
    companyName?: string;
    hqAddress?: string;
    managerName?: string;
    managerEmail?: string;
    managerPhone?: string;
    imageUrl: string;
  };
  try {
    const updatedTeam = await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        teamName,
        companyName,
        hqAddress,
        managerName,
        managerEmail,
        managerPhone,
        imageUrl,
      },
    });
    sendResponse(reply, 200, {
      success: true,
      message: "Team updated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error updating team",
      error: error,
    });
  }
};

export const deleteTeam = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const teamId = parseInt(id);
  try {
    const deletedTeam = await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        status: "non-active",
      },
    });
    // const deletedTeam = await prisma.team.delete({
    //   where: {
    //     id: teamId,
    //   },
    // });
    sendResponse(reply, 200, {
      success: true,
      message: "Team deleted successfully",
      data: deletedTeam,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error deleting team",
      error: error,
    });
  }
};

export const getTeamContracts = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const contracts = await prisma.teamContract.findMany({
      include: {
        team: true,
      },
    });
    sendResponse(reply, 200, {
      success: true,
      message: "Team contracts fetched successfully",
      data: contracts,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error fetching team contracts",
      error: error,
    });
  }
};

export const getTeamContractById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: number };
  try {
    const contract = await prisma.teamContract.findUnique({
      where: {
        id,
      },
      include: {
        team: true,
      },
    });
    sendResponse(reply, 200, {
      success: true,
      message: "Team contract fetched successfully",
      data: contract,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error fetching team contract",
      error: error,
    });
  }
};

export const createTeamContract = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const {
    contractNumber,
    teamId,
    activePeriodStart,
    activePeriodEnd,
    memberQuota,
    packageId,
    status,
  } = request.body as {
    contractNumber?: string;
    teamId: number;
    activePeriodStart?: Date;
    activePeriodEnd: Date;
    memberQuota: number;
    packageId: number;
    status?: string;
  };

  try {
    const newContract = await prisma.teamContract.create({
      data: {
        contractNumber,
        teamId,
        activePeriodStart,
        activePeriodEnd,
        memberQuota,
        packageId,
        status,
      },
    });
    sendResponse(reply, 201, {
      success: true,
      message: "Team contract created successfully",
      data: newContract,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error creating team contract",
      error: error,
    });
  }
};

export const updateTeamContract = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: number };
  const {
    contractNumber,
    teamId,
    activePeriodStart,
    activePeriodEnd,
    memberQuota,
    packageId,
    status,
  } = request.body as {
    contractNumber?: string;
    teamId?: number;
    activePeriodStart?: Date;
    activePeriodEnd?: Date;
    memberQuota?: number;
    packageId?: number;
    status?: string;
  };

  try {
    const updatedContract = await prisma.teamContract.update({
      where: {
        id,
      },
      data: {
        contractNumber,
        teamId,
        activePeriodStart,
        activePeriodEnd,
        memberQuota,
        packageId,
        status,
      },
    });
    sendResponse(reply, 200, {
      success: true,
      message: "Team contract updated successfully",
      data: updatedContract,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error updating team contract",
      error: error,
    });
  }
};

export const deleteTeamContract = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: number };
  try {
    const deletedContract = await prisma.teamContract.delete({
      where: {
        id,
      },
    });
    sendResponse(reply, 200, {
      success: true,
      message: "Team contract deleted successfully",
      data: deletedContract,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error deleting team contract",
      error: error,
    });
  }
};
