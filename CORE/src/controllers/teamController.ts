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
        status: {
          not: "non-active",
        },
      },
    };

    /** Fetch teams */
    const teams = await prisma.team.findMany(options);

    if (teams.length === 0) {
      return sendResponse(reply, 200, {
        success: true,
        message: "No teams found.",
        data: [],
      });
    }

    /** Sanitize the response */
    const sanitizedTeams = teams.map((team) => ({
      ...team,
      members: team.members.map((member) => ({
        ...omit(member, ["password"]),
        role: omit(member.role, ["authorizedMenu"]),
      })),
    }));

    /** Send response */
    return sendResponse(reply, 200, {
      success: true,
      message: "Teams fetched successfully.",
      data: sanitizedTeams,
    });
  } catch (error) {
    /** Send error response */
    return sendResponse(reply, 500, {
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
        status: {
          not: "non-active",
        },
      },
      include: {
        members: { include: { role: true } },
        contracts: true,
      },
    });

    if (!team) {
      return sendResponse(reply, 404, {
        success: false,
        message: "Team not found",
      });
    }

    const sanitizedTeam = {
      ...team,
      members: team?.members.map((member) => ({
        ...omit(member, ["password"]),
        role: omit(member.role, ["authorizedMenu"]),
      })),
    };

    return sendResponse(reply, 200, {
      success: true,
      message: "Team fetched successfully",
      data: sanitizedTeam,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
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
    managerFirstName,
    managerLastName,
    managerEmail,
    managerPhone,
    imageUrl,
    contractNumber,
    activePeriodStart,
    activePeriodEnd,
    memberQuota,
    packageId,
  } = request.body as {
    teamName: string;
    companyName?: string;
    hqAddress?: string;
    managerFirstName?: string;
    managerLastName?: string;
    managerEmail: string;
    managerPhone?: string;
    imageUrl: string;
    contractNumber?: string;
    activePeriodStart?: Date;
    activePeriodEnd: Date;
    memberQuota: number;
    packageId: number;
  };
  try {
    const newTeam = await prisma.team.create({
      data: {
        teamName,
        companyName,
        hqAddress,
        managerFirstName,
        managerLastName,
        managerFullName: `${managerFirstName} ${managerLastName}`,
        managerEmail,
        managerPhone,
        imageUrl,
        status: "active",
      },
    });

    await prisma.teamContract.create({
      data: {
        contractNumber,
        teamId: newTeam.id,
        activePeriodStart,
        activePeriodEnd,
        memberQuota,
        packageId,
        status: "active",
      },
    });

    const generateNumericID = (length = 6) =>
      Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
    const generatePassword = String(Math.random()).substring(2, 9);
    /** Transaction to create member */
    await prisma.$transaction(async (prisma) => {
      /** Create member */
      const member = await prisma.member.create({
        data: {
          uid: generateNumericID(9),
          email: managerEmail,
          phoneNumber: managerPhone,
          firstName: managerFirstName,
          lastName: managerLastName,
          fullName: `${managerFirstName} ${managerLastName}`,
          password: generatePassword,
          teamId: newTeam.id,
          roleId: 1,
          status: "active",
        },
      });
      return member;
    });

    const renderMember = await prisma.member.findMany({
      where: {
        teamId: newTeam.id,
      },
      include: {
        role: true,
      },
    });
    const renderContract = await prisma.teamContract.findMany({
      where: {
        teamId: newTeam.id,
      },
    });

    /** Send response */
    return sendResponse(reply, 201, {
      success: true,
      message: "Team created successfully",
      data: { ...newTeam, members: renderMember, contracts: renderContract },
    });
  } catch (error) {
    /** Send error response */
    return sendResponse(reply, 500, {
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
    managerFirstName,
    managerLastName,
    managerEmail,
    managerPhone,
    imageUrl,
  } = request.body as {
    teamName: string;
    companyName?: string;
    hqAddress?: string;
    managerFirstName?: string;
    managerLastName?: string;
    managerEmail?: string;
    managerPhone?: string;
    imageUrl: string;
  };
  try {
    const existingTeam = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
    });

    if (!existingTeam) {
      return sendResponse(reply, 404, {
        success: false,
        message: "Team not found",
        data: null,
      });
    }
    const updatedTeam = await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        teamName,
        companyName,
        hqAddress,
        managerFirstName,
        managerLastName,
        managerFullName: `${managerFirstName} ${managerLastName}`,
        managerEmail,
        managerPhone,
        imageUrl,
      },
    });
    return sendResponse(reply, 200, {
      success: true,
      message: "Team updated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
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
    const existingTeam = await prisma.team.findUnique({
      where: {
        id: teamId,
        status: {
          contains: "active",
          mode: "insensitive",
          not: "non-active",
        },
      },
    });

    if (!existingTeam) {
      return sendResponse(reply, 404, {
        success: false,
        message: "Team not found",
        data: null,
      });
    }
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
    return sendResponse(reply, 200, {
      success: true,
      message: "Team deleted successfully",
      data: deletedTeam,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
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
  const { id } = request.params as { id: string };
  try {
    const teamId = parseInt(id);
    const contracts = await prisma.teamContract.findMany({
      where: {
        teamId,
      },
      include: {
        team: true,
      },
    });
    return sendResponse(reply, 200, {
      success: true,
      message: "Team contracts fetched successfully",
      data: contracts,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
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
  const { id, contractId } = request.params as {
    id: string;
    contractId: string;
  };
  try {
    const teamId = parseInt(id);
    const cid = parseInt(contractId);
    const contract = await prisma.teamContract.findUnique({
      where: {
        id: cid,
        teamId,
      },
      include: {
        team: true,
      },
    });
    return sendResponse(reply, 200, {
      success: true,
      message: "Team contract fetched successfully",
      data: contract,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
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
    return sendResponse(reply, 201, {
      success: true,
      message: "Team contract created successfully",
      data: newContract,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
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
    return sendResponse(reply, 200, {
      success: true,
      message: "Team contract updated successfully",
      data: updatedContract,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
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
    return sendResponse(reply, 200, {
      success: true,
      message: "Team contract deleted successfully",
      data: deletedContract,
    });
  } catch (error) {
    return sendResponse(reply, 500, {
      success: false,
      message: "Error deleting team contract",
      error: error,
    });
  }
};
