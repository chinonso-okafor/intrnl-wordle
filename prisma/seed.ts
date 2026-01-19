import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { VALID_WORDS } from "../lib/words";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      passwordHash: adminPassword,
      role: "ADMIN" as any,
    },
  });

  console.log("Created admin user:", admin.email);

  // Create a test user
  const userPassword = await bcrypt.hash("user123", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Test User",
      passwordHash: userPassword,
      role: "USER" as any,
    },
  });

  console.log("Created test user:", user.email);

  // Set today's word
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayWord = VALID_WORDS[Math.floor(Math.random() * VALID_WORDS.length)];
  
  await prisma.word.upsert({
    where: { dateUsed: today },
    update: {},
    create: {
      word: todayWord,
      dateUsed: today,
      createdBy: admin.id,
    },
  });

  console.log(`Set today's word: ${todayWord}`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
