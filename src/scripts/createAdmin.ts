import mongoose from "mongoose";
import { env } from "../config/env.js";
import User from "../modules/auth/models/user.model.js";

export async function createAdminUser(
  email = "admin@devprep.com",
  password = "AdminPassword123!",
  name = "System Admin"
) {
  await mongoose.connect(env.MONGODB_URI);

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        console.log(`[Admin] Existing user ${email} upgraded to admin.`);
      } else {
        console.log(`[Admin] Admin user ${email} already exists.`);
      }
      return existing;
    }

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "admin",
      status: "active",
      emailVerified: true,
    });

    console.log(`[Admin] Successfully created initial admin account: ${email}`);
    return admin;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

// Direct execution from CLI
if (process.argv[1]?.endsWith("createAdmin.ts") || process.argv[1]?.endsWith("createAdmin.js")) {
  const customEmail = process.argv[2] || "admin@devprep.com";
  const customPass = process.argv[3] || "AdminPassword123!";
  const customName = process.argv[4] || "System Admin";

  createAdminUser(customEmail, customPass, customName)
    .then(() => {
      console.log("Admin setup finished.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Admin setup failed:", err);
      process.exit(1);
    });
}
