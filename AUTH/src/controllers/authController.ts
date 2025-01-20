import { PrismaClient } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendResponse } from "../helpers";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SALT_ROUNDS = 10;

// const WHITELIST_URLS = ["http://localhost:3000", "https://sigap.noxus.com"];

export const getCurrentUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendResponse(reply, 401, {
      success: false,
      message: "Authorization header is missing or invalid",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verifikasi token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    // Cari pengguna berdasarkan ID yang ada dalam token
    const user = await prisma.member.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        uid: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
        team: true,
        role: true,
      },
    });

    if (!user) {
      return sendResponse(reply, 404, {
        success: false,
        message: "User not found",
      });
    }

    sendResponse(reply, 200, {
      success: true,
      message: "Current user retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    sendResponse(reply, 401, {
      success: false,
      message: "You are not authenticated",
    });
  }
};

/**
 * Login
 */
export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  const { client_url, email, password } = request.body as {
    client_url: string;
    email: string;
    password: string;
  };

  try {
    const user = await prisma.member.findUnique({
      where: { email: email },
      select: {
        id: true,
        uid: true,
        email: true,
        password: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
        team: true,
        role: true,
      },
    });

    if (!user || !user.password) {
      return sendResponse(reply, 401, {
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendResponse(reply, 401, {
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

    const mappedUser = {
      id: user.id,
      uid: user.uid,
      email: user.email,
      phoneNumber: user.phoneNumber,
      firsName: user.firstName,
      lastName: user.lastName,
      employeeNumber: user.employeeNumber,
      team: user.team,
      role: user.role,
    };

    sendResponse(reply, 200, {
      success: true,
      message: "Login successful",
      data: {
        token,
        ...mappedUser,
        client_url,
        authorized_url: `http://${client_url}/${token}`,
      },
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error during login",
      error,
    });
  }
};

import nodemailer from "nodemailer"; // Add Nodemailer for sending emails

export const forgetPassword = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { email } = request.body as { email: string };

  try {
    const member = await prisma.member.findUnique({ where: { email } });

    if (!member) {
      return sendResponse(reply, 404, {
        success: false,
        message: "Member not found",
      });
    }

    // Generate password reset token
    const resetToken = jwt.sign({ id: member.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Generate password reset link (example URL)
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

    // Send password reset email
    const transporter = nodemailer.createTransport({
      service: "gmail", // Or use your preferred email service
      auth: {
        user: process.env.EMAIL_USER, // Replace with your email credentials
        pass: process.env.EMAIL_PASS, // Replace with your email password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, // Your email address
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>Hello ${member.firstName + " " + member.lastName},</p>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>The link will expire in 1 hour.</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Respond to the client
    sendResponse(reply, 200, {
      success: true,
      message: "Password reset link has been sent to your email",
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error generating or sending reset token",
      error,
    });
  }
};

/**
 * Reset Password
 */
export const resetPassword = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { resetToken, newPassword } = request.body as {
    resetToken: string;
    newPassword: string;
  };

  try {
    const decoded = jwt.verify(resetToken, JWT_SECRET) as { id: number };

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.member.update({
      where: { id: decoded.id },
      data: { password: hashedPassword },
    });

    sendResponse(reply, 200, {
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error resetting password",
      error,
    });
  }
};

/**
 * Update Profile
 */
export const updateProfile = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id, firstName, lastName, phoneNumber, homeAddress } =
    request.body as {
      id?: number;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      homeAddress?: string;
    };

  try {
    const updatedUser = await prisma.member.update({
      where: { id },
      data: { firstName, lastName, phoneNumber, homeAddress },
    });

    sendResponse(reply, 200, {
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    sendResponse(reply, 500, {
      success: false,
      message: "Error updating profile",
      error,
    });
  }
};
