import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Seed roles
  const roles = await prisma.role.createMany({
    data: [
      {
        name: "Admin",
        description: "Administrator with full access",
        authorizedMenu: {},
        status: "Active",
      },
      {
        name: "User",
        description: "Regular user with limited access",
        authorizedMenu: ["Dashboard"],
        status: "Active",
      },
    ],
    skipDuplicates: true,
  });

  console.log(`${roles.count} roles created.`);

  // Seed teams
  const team = await prisma.team.upsert({
    where: { teamName: "Development Team" },
    update: {},
    create: {
      teamName: "Development Team",
      companyName: "Tech Solutions Ltd.",
      hqAddress: "123 Main Street, Cityville",
      managerName: "John Doe",
      managerEmail: "john.doe@techsolutions.com",
      managerPhone: "1234567890",
      imageUrl: "/images/development-team.png",
      status: "Active",
    },
  });

  console.log(`Team "${team.teamName}" created.`);

  // Seed team contracts
  const teamContract = await prisma.teamContract.upsert({
    where: { contractNumber: "DEV-2025-001" },
    update: {},
    create: {
      contractNumber: "DEV-2025-001",
      teamId: team.id,
      activePeriodStart: new Date("2025-01-01"),
      activePeriodEnd: new Date("2025-12-31"),
      memberQuota: 15,
      packageId: 1, // Replace with an actual package ID
      status: "Active",
    },
  });

  console.log(`Contract "${teamContract.contractNumber}" created.`);

  const hashedPassword = await bcrypt.hash("1234", 10);

  // Seed members
  const member = await prisma.member.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      phoneNumber: "0987654321",
      name: "Admin User",
      password: hashedPassword, // Replace with a hashed password
      employeeNumber: "EMP001",
      joinedDate: new Date("2023-01-01"),
      homeAddress: "789 Main Street, Cityville",
      district: "Downtown",
      subDistrict: "North District",
      birthPlace: "Cityville",
      birthDate: new Date("1990-01-01"),
      gender: "Male",
      nationality: "Countryland",
      religion: "None",
      teamId: team.id,
      roleId: 1,
      administration: {
        create: {
          taxNumber: "TAX-1234",
          cardNumber: "CARD-5678",
          passportNumber: "P1234567",
          nationalityCardPath: "/documents/nationality-card.png",
          familyCardPath: "/documents/family-card.png",
        },
      },
      relatives: {
        create: {
          full_name: "Jane Doe",
          relation: "Spouse",
          phone_number: "9876543210",
        },
      },
    },
  });

  console.log(`Member "${member.name}" created.`);

  // Seed packages
  const packages = await prisma.package.createMany({
    data: [
      {
        name: "Basic Package",
        description: "Access to basic features",
        imageUrl: "/images/basic-package.png",
        selectedMenu: [1, 2], // Replace with actual menu IDs
        status: "Active",
      },
      {
        name: "Premium Package",
        description: "Access to all features",
        imageUrl: "/images/premium-package.png",
        selectedMenu: [1], // Replace with actual menu IDs
        status: "Active",
      },
    ],
    skipDuplicates: true,
  });

  console.log(`${packages.count} packages created.`);

  // Seed menus
  const menus = await prisma.menu.createMany({
    data: [
      {
        name: "Teams",
        description: "View overall stats and metrics",
        urlMenu: "/teams",
        iconMenu: "dashboard-icon",
        category: "Main",
        orderingNumber: 1,
        parentMenu: {}, // No parent menu
        status: "Active",
      },
      {
        name: "Package",
        description: "Manage system settings",
        urlMenu: "/packages",
        iconMenu: "package-icon",
        category: "Main",
        orderingNumber: 2,
        parentMenu: {}, // No parent menu
        status: "Active",
      },
      {
        name: "Menu",
        description: "Manage menus",
        urlMenu: "/menus",
        iconMenu: "menu-icon",
        category: "Main",
        orderingNumber: 3,
        parentMenu: {}, // No parent menu
        status: "Active",
      },
      {
        name: "Roles",
        description: "Manage roles",
        urlMenu: "/roles",
        iconMenu: "roles-icon",
        category: "Main",
        orderingNumber: 4,
        parentMenu: {}, // No parent menu
        status: "Active",
      },
    ],
    skipDuplicates: true,
  });

  console.log(`${menus.count} menus created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
