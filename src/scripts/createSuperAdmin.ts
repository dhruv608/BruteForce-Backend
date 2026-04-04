import prisma from "../config/prisma";
import { hashPassword } from "../utils/password.util";

async function main() {
  const password_hash = await hashPassword("123456");

  // Check if superadmin already exists
  const existingSuperadmin = await prisma.admin.findFirst({
    where: { role: "SUPERADMIN" }
  });

  if (existingSuperadmin) {
    console.log("Superadmin already exists:", existingSuperadmin.email);
    console.log("Login credentials:");
    console.log("Email:", existingSuperadmin.email);
    console.log("Password: 123456");
    return;
  }

  // Create new superadmin
  const superadmin = await prisma.admin.upsert({
    where: { email: "satya@example.com" },
    create: {
      name: "Dhruv",
      email: "satya@example.com",
      password_hash,
      role: "SUPERADMIN",
    },
    update: {},
  });

  console.log("✅ SuperAdmin created successfully!");
  console.log("📧 Email:", superadmin.email);
  console.log("🔑 Password: 123456");
  console.log("🎯 Role:", superadmin.role);
  console.log("\n🔐 Login at: POST /api/auth/admin/login");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());