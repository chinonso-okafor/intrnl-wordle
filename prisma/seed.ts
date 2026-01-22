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
      role: "ADMIN",
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
      role: "USER",
    },
  });

  console.log("Created test user:", user.email);

  // Seed answer words (use VALID_WORDS as initial answer words)
  console.log("Seeding answer words...");
  let answerWordCount = 0;
  for (const word of VALID_WORDS) {
    try {
      await prisma.answerWord.upsert({
        where: { word },
        update: {},
        create: {
          word,
          source: "supplemental",
        },
      });
      answerWordCount++;
    } catch (error) {
      // Skip duplicates
    }
  }
  console.log(`Seeded ${answerWordCount} answer words`);

  // Seed validation words (use VALID_WORDS as initial validation words)
  console.log("Seeding validation words...");
  let validationWordCount = 0;
  for (const word of VALID_WORDS) {
    try {
      await prisma.validationWord.upsert({
        where: { word },
        update: {},
        create: { word },
      });
      validationWordCount++;
    } catch (error) {
      // Skip duplicates
    }
  }
  console.log(`Seeded ${validationWordCount} validation words`);

  // Set today's word
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayWord = VALID_WORDS[Math.floor(Math.random() * VALID_WORDS.length)];
  
  // Get or create answer word
  let answerWord = await prisma.answerWord.findUnique({
    where: { word: todayWord },
  });

  if (!answerWord) {
    answerWord = await prisma.answerWord.create({
      data: {
        word: todayWord,
        source: "supplemental",
      },
    });
  }
  
  await prisma.word.upsert({
    where: { dateUsed: today },
    update: {},
    create: {
      answerWordId: answerWord.id,
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
