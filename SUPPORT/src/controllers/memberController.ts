/* eslint-disable @typescript-eslint/no-explicit-any */
import { MemberRelatives, PrismaClient } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { sendResponse } from "../helpers";
import { omit } from "lodash";

const prisma = new PrismaClient();

/* Explanation: This function is used to get all members. */
export const getMembers = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    /** Get query parameters */
    const { type, teamId, page, limit, sortBy, sortOrder } = request.query as {
      type?: string;
      teamId?: string;
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
    const options: any = {
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy: { [orderField]: orderDirection },
      include: {
        team: true,
        role: true,
        administration: true,
        relatives: true,
      },
    };

    /** Filter by type and teamId */
    if (type === "team" && teamId) {
      options.where = { teamId: parseInt(teamId, 10) };
    }

    /** Fetch members */
    const members = await prisma.member.findMany(options);

    /** Sanitize the response */
    const sanitizedMembers = members.map((member) =>
      omit(member, [
        "password",
        "administration",
        "role.authorizedMenu",
        "team.hqAddress",
        "team.managerName",
        "team.managerEmail",
        "team.managerPhone",
      ])
    );

    /** Send response */
    sendResponse(reply, 200, {
      success: true,
      message: "Members fetched successfully",
      data: sanitizedMembers,
    });
  } catch (error) {
    /** Send error response */
    sendResponse(reply, 500, {
      success: false,
      message: "Error fetching members",
      error: error,
    });
  }
};

export const getMemberById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  try {
    const memberId = parseInt(id);
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        uid: true,
        email: true,
        phoneNumber: true,
        name: true,
        employeeNumber: true,
        profileImage: true,
        joinedDate: true,
        resignedDate: true,
        homeAddress: true,
        district: true,
        subDistrict: true,
        birthPlace: true,
        birthDate: true,
        gender: true,
        nationality: true,
        religion: true,
        maritalStatus: true,
        team: true,
        role: true,
        administration: true,
        relatives: true,
        activityLogs: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!member) {
      sendResponse(reply, 404, {
        success: false,
        message: "Member not found",
      });
      return;
    }

    sendResponse(reply, 200, {
      success: true,
      message: "Member fetched successfully",
      data: member,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error fetching member",
      error: error,
    });
  }
};

export const createMember = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const {
    profileImage,
    email,
    phoneNumber,
    name,
    employeeNumber,
    joinedDate,
    resignedDate,
    homeAddress,
    district,
    subDistrict,
    birthPlace,
    birthDate,
    gender,
    nationality,
    religion,
    maritalStatus,
    teamId,
    roleId,
    taxNumber,
    taxNumberAttachment,
    identityNumber,
    identityNumberAttachment,
    relatives,
  } = request.body as {
    profileImage?: string;
    email: string;
    phoneNumber?: string;
    name?: string;
    employeeNumber?: string;
    joinedDate?: Date;
    resignedDate?: Date;
    homeAddress?: string;
    district?: string;
    subDistrict?: string;
    birthPlace?: string;
    birthDate?: Date;
    gender?: string;
    nationality?: string;
    religion?: string;
    maritalStatus?: string;
    teamId?: number;
    roleId: number;
    taxNumber?: string;
    taxNumberAttachment?: string;
    identityNumber?: string;
    identityNumberAttachment?: string;
    relatives?: MemberRelatives[];
  };
  const generateNumericGameID = (length = 6) =>
    Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
  try {
    // Transaction for creating member and member administration
    const result = await prisma.$transaction(async (prisma) => {
      // Create the member first
      const newMember = await prisma.member.create({
        data: {
          uid: generateNumericGameID(9),
          profileImage,
          email,
          phoneNumber,
          name,
          employeeNumber,
          joinedDate,
          resignedDate,
          homeAddress,
          district,
          subDistrict,
          birthPlace,
          birthDate,
          gender,
          nationality,
          religion,
          maritalStatus,
          teamId,
          roleId,
        },
      });

      // Use the created member's ID for administration
      const newMemberAdministration = await prisma.memberAdministration.create({
        data: {
          memberId: newMember.id,
          taxNumber,
          taxNumberAttachment,
          identityNumber,
          identityNumberAttachment,
        },
      });

      if (relatives && relatives.length > 0) {
        await Promise.all(
          relatives.map((relative) =>
            prisma.memberRelatives.create({
              data: {
                memberId: newMember.id,
                fullName: relative.fullName,
                relationType: relative.relationType,
                phone_number: relative.phone_number,
                isEmergency: relative.isEmergency,
              },
            })
          )
        );
      }

      return { newMember, newMemberAdministration };
    });

    // Access the result after the transaction
    const { newMember, newMemberAdministration } = result;

    // Handle relatives creation

    sendResponse(reply, 201, {
      success: true,
      message: "Member created successfully",
      data: {
        member: newMember,
        administration: newMemberAdministration,
      },
    });
  } catch (error) {
    console.error("Error creating member:", error);

    sendResponse(reply, 500, {
      success: false,
      message: "Failed to create member. Please try again later.",
      error: error,
    });
  }
};

export const updateMember = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const {
    profileImage,
    phoneNumber,
    name,
    joinedDate,
    resignedDate,
    homeAddress,
    district,
    subDistrict,
    birthPlace,
    birthDate,
    gender,
    nationality,
    religion,
    maritalStatus,
    teamId,
    roleId,
    taxNumber,
    taxNumberAttachment,
    identityNumber,
    identityNumberAttachment,
    relatives,
  } = request.body as {
    profileImage?: string;
    email?: string;
    phoneNumber?: string;
    name?: string;
    employeeNumber?: string;
    joinedDate?: Date;
    resignedDate?: Date;
    homeAddress?: string;
    district?: string;
    subDistrict?: string;
    birthPlace?: string;
    birthDate?: Date;
    gender?: string;
    nationality?: string;
    religion?: string;
    maritalStatus?: string;
    teamId?: number;
    roleId?: number;
    taxNumber?: string;
    taxNumberAttachment?: string;
    identityNumber?: string;
    identityNumberAttachment?: string;
    relatives?: MemberRelatives[];
  };

  const memberId = parseInt(id);

  try {
    // Transaction for updating member and related entities
    await prisma.$transaction(async (prisma) => {
      // Update the member details
      await prisma.member.update({
        where: { id: memberId },
        data: {
          profileImage,
          phoneNumber,
          name,
          joinedDate,
          resignedDate,
          homeAddress,
          district,
          subDistrict,
          birthPlace,
          birthDate,
          gender,
          nationality,
          religion,
          maritalStatus,
          teamId,
          roleId,
        },
      });

      // Update or create member administration details

      await prisma.memberAdministration.upsert({
        where: { memberId: memberId },
        create: {
          memberId: memberId,
          taxNumber,
          taxNumberAttachment,
          identityNumber,
          identityNumberAttachment,
        },
        update: {
          taxNumber,
          taxNumberAttachment,
          identityNumber,
          identityNumberAttachment,
        },
      });

      // Handle relatives: Delete existing and add new relatives
      if (relatives && relatives.length > 0) {
        // Delete existing relatives
        await prisma.memberRelatives.deleteMany({
          where: { memberId: memberId },
        });

        // Create new relatives
        await Promise.all(
          relatives.map((relative) =>
            prisma.memberRelatives.create({
              data: {
                memberId: memberId,
                fullName: relative.fullName,
                relationType: relative.relationType,
                phone_number: relative.phone_number,
                isEmergency: relative.isEmergency,
              },
            })
          )
        );
      }
    });

    const members = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        team: true,
        role: true,
        administration: true,
        relatives: true,
      },
    });

    // Exclude specific fields from the updatedMember
    const sanitizedMember = omit(members, ["password"]);

    sendResponse(reply, 200, {
      success: true,
      message: "Member updated successfully",
      data: sanitizedMember,
    });
  } catch (error) {
    console.error("Error updating member:", error);

    sendResponse(reply, 500, {
      success: false,
      message: "Failed to update member. Please try again later.",
      error: error,
    });
  }
};

export const deleteMember = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const memberId = parseInt(id);
  try {
    await prisma.member.update({
      where: { id: memberId },
      data: {
        status: "non-active",
      },
    });
    // const deletedMember = await prisma.member.delete({
    //   where: { id: memberId },
    // });

    sendResponse(reply, 200, {
      success: true,
      message: "Member deleted successfully",
      // data: deletedMember,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error deleting member",
      error: error,
    });
  }
};

export const verifyMember = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const {
    profileImage,
    phoneNumber,
    name,
    joinedDate,
    resignedDate,
    homeAddress,
    district,
    subDistrict,
    birthPlace,
    birthDate,
    gender,
    nationality,
    religion,
    maritalStatus,
    teamId,
    roleId,
    taxNumber,
    taxNumberAttachment,
    identityNumber,
    identityNumberAttachment,
    relatives,
  } = request.body as {
    profileImage?: string;
    email?: string;
    phoneNumber?: string;
    name?: string;
    employeeNumber?: string;
    joinedDate?: Date;
    resignedDate?: Date;
    homeAddress?: string;
    district?: string;
    subDistrict?: string;
    birthPlace?: string;
    birthDate?: Date;
    gender?: string;
    nationality?: string;
    religion?: string;
    maritalStatus?: string;
    teamId?: number;
    roleId?: number;
    taxNumber?: string;
    taxNumberAttachment?: string;
    identityNumber?: string;
    identityNumberAttachment?: string;
    relatives?: MemberRelatives[];
  };

  const memberId = parseInt(id);

  try {
    // Transaction for updating member and related entities
    await prisma.$transaction(async (prisma) => {
      // Update the member details
      await prisma.member.update({
        where: { id: memberId },
        data: {
          profileImage,
          phoneNumber,
          name,
          joinedDate,
          resignedDate,
          homeAddress,
          district,
          subDistrict,
          birthPlace,
          birthDate,
          gender,
          nationality,
          religion,
          maritalStatus,
          teamId,
          roleId,
        },
      });

      // Update or create member administration details

      await prisma.memberAdministration.upsert({
        where: { memberId: memberId },
        create: {
          memberId: memberId,
          taxNumber,
          taxNumberAttachment,
          identityNumber,
          identityNumberAttachment,
        },
        update: {
          taxNumber,
          taxNumberAttachment,
          identityNumber,
          identityNumberAttachment,
        },
      });

      // Handle relatives: Delete existing and add new relatives
      if (relatives && relatives.length > 0) {
        // Delete existing relatives
        await prisma.memberRelatives.deleteMany({
          where: { memberId: memberId },
        });

        // Create new relatives
        await Promise.all(
          relatives.map((relative) =>
            prisma.memberRelatives.create({
              data: {
                memberId: memberId,
                fullName: relative.fullName,
                relationType: relative.relationType,
                phone_number: relative.phone_number,
                isEmergency: relative.isEmergency,
              },
            })
          )
        );
      }
    });

    const members = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        team: true,
        role: true,
        administration: true,
        relatives: true,
      },
    });

    // Exclude specific fields from the updatedMember
    const sanitizedMember = omit(members, ["password"]);

    sendResponse(reply, 200, {
      success: true,
      message: "Member updated successfully",
      data: sanitizedMember,
    });
  } catch (error) {
    console.error("Error updating member:", error);

    sendResponse(reply, 500, {
      success: false,
      message: "Failed to update member. Please try again later.",
      error: error,
    });
  }
};
