import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CURATED_ANSWER_WORDS } from "../lib/curated-answer-words";
import * as fs from "fs";
import * as path from "path";

// Load validation words from JSON file
const validationWordsPath = path.join(__dirname, "../lib/curated-validation-words.json");
const CURATED_VALIDATION_WORDS: string[] = JSON.parse(
  fs.readFileSync(validationWordsPath, "utf-8")
);

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

  // Clear existing word data to avoid duplicates
  console.log("Clearing existing word data...");
  await prisma.word.deleteMany({});
  await prisma.answerWord.deleteMany({});
  await prisma.validationWord.deleteMany({});

  // Seed answer words from curated list (deduplicated)
  const answerSet = new Set(CURATED_ANSWER_WORDS.map(w => w.toUpperCase()));
  const answerWords = Array.from(answerSet);
  console.log(`Seeding ${answerWords.length} unique curated answer words...`);
  
  let answerWordCount = 0;
  const chunkSize = 500;
  
  for (let i = 0; i < answerWords.length; i += chunkSize) {
    const chunk = answerWords.slice(i, i + chunkSize);
    await prisma.answerWord.createMany({
      data: chunk.map(word => ({ word, source: "curated" })),
    });
    answerWordCount = Math.min(i + chunkSize, answerWords.length);
    console.log(`  Progress: ${answerWordCount}/${answerWords.length} answer words`);
  }
  console.log(`Seeded ${answerWordCount} answer words`);

  // Seed validation words (excluding answer words)
  const validationWords = CURATED_VALIDATION_WORDS
    .map(w => w.toUpperCase())
    .filter(w => !answerSet.has(w));
  const uniqueValidationWords = Array.from(new Set(validationWords));
  
  console.log(`Seeding ${uniqueValidationWords.length} validation words...`);
  let validationWordCount = 0;
  
  for (let i = 0; i < uniqueValidationWords.length; i += chunkSize) {
    const chunk = uniqueValidationWords.slice(i, i + chunkSize);
    await prisma.validationWord.createMany({
      data: chunk.map(word => ({ word })),
    });
    validationWordCount = Math.min(i + chunkSize, uniqueValidationWords.length);
    console.log(`  Progress: ${validationWordCount}/${uniqueValidationWords.length} validation words`);
  }
  console.log(`Seeded ${validationWordCount} validation words`);

  // Set today's word
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayWord = answerWords[Math.floor(Math.random() * answerWords.length)];
  
  // Get or create answer word
  let answerWord = await prisma.answerWord.findUnique({
    where: { word: todayWord },
  });

  if (!answerWord) {
    answerWord = await prisma.answerWord.create({
      data: {
        word: todayWord,
        source: "curated",
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

  // Print summary
  const finalAnswerCount = await prisma.answerWord.count();
  const finalValidationCount = await prisma.validationWord.count();
  
  console.log("\n=== Seed Summary ===");
  console.log(`Answer words (daily puzzles): ${finalAnswerCount}`);
  console.log(`Validation words (valid guesses): ${finalValidationCount}`);
  console.log(`Total unique valid words: ${finalAnswerCount + finalValidationCount}`);
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
