"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../config/prisma"));
const password_util_1 = require("../utils/password.util");
async function main() {
    const password_hash = await (0, password_util_1.hashPassword)("123456");
    // Check if superadmin already exists
    const existingSuperadmin = await prisma_1.default.admin.findFirst({
        where: { role: "SUPERADMIN" }
    });
    if (existingSuperadmin) {
        console.log("Superadmin already exists:", existingSuperadmin.email);
        console.log("Login credentials:");
        console.log("Email:", existingSuperadmin.email);
        console.log("Username:", existingSuperadmin.username);
        console.log("Password: 123456");
        return;
    }
    // Create new superadmin
    const superadmin = await prisma_1.default.admin.upsert({
        where: { email: "superadmin@test.com" },
        create: {
            name: "Dhruv",
            email: "superadmin@test.com",
            username: "superadmin",
            password_hash,
            role: "SUPERADMIN",
        },
        update: {},
    });
    console.log("✅ SuperAdmin created successfully!");
    console.log("📧 Email:", superadmin.email);
    console.log("👤 Username:", superadmin.username);
    console.log("🔑 Password: 123456");
    console.log("🎯 Role:", superadmin.role);
    console.log("\n🔐 Login at: POST /api/auth/admin/login");
}
main()
    .catch(console.error)
    .finally(() => prisma_1.default.$disconnect());
