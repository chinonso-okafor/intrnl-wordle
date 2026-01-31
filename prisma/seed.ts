import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CURATED_ANSWER_WORDS } from "../lib/curated-answer-words";
import { dateStringToUTCMidnight } from "../lib/utils";
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

  // Only seed answer words if table is empty (idempotent - do not wipe on re-run)
  const existingAnswerCount = await prisma.answerWord.count();
  let answerWords: string[] = [];
  if (existingAnswerCount === 0) {
    const answerSet = new Set(CURATED_ANSWER_WORDS.map(w => w.toUpperCase()));
    answerWords = Array.from(answerSet);
    console.log(`Seeding ${answerWords.length} unique curated answer words...`);
    const chunkSize = 500;
    for (let i = 0; i < answerWords.length; i += chunkSize) {
      const chunk = answerWords.slice(i, i + chunkSize);
      await prisma.answerWord.createMany({
        data: chunk.map(word => ({ word, source: "curated" })),
      });
      console.log(`  Progress: ${Math.min(i + chunkSize, answerWords.length)}/${answerWords.length} answer words`);
    }
    console.log(`Seeded ${answerWords.length} answer words`);
  } else {
    console.log(`Answer words already exist (${existingAnswerCount}), skipping answer word seed`);
    answerWords = (await prisma.answerWord.findMany({ select: { word: true } })).map(aw => aw.word);
  }

  // Only seed validation words if table is empty (idempotent)
  const existingValidationCount = await prisma.validationWord.count();
  if (existingValidationCount === 0) {
    const answerSet = new Set(answerWords.map(w => w.toUpperCase()));
    const validationWords = CURATED_VALIDATION_WORDS
      .map(w => w.toUpperCase())
      .filter(w => !answerSet.has(w));
    const uniqueValidationWords = Array.from(new Set(validationWords));
    console.log(`Seeding ${uniqueValidationWords.length} validation words...`);
    const chunkSize = 500;
    for (let i = 0; i < uniqueValidationWords.length; i += chunkSize) {
      const chunk = uniqueValidationWords.slice(i, i + chunkSize);
      await prisma.validationWord.createMany({
        data: chunk.map(word => ({ word })),
      });
      console.log(`  Progress: ${Math.min(i + chunkSize, uniqueValidationWords.length)}/${uniqueValidationWords.length} validation words`);
    }
    console.log(`Seeded ${uniqueValidationWords.length} validation words`);
  } else {
    console.log(`Validation words already exist (${existingValidationCount}), skipping validation word seed`);
  }

  // Only set today's word if no word exists for today (idempotent - preserves word across redeploys)
  const todayStr = new Date().toISOString().split("T")[0];
  const today = dateStringToUTCMidnight(todayStr);
  const existingTodayWord = await prisma.word.findUnique({
    where: { dateUsed: today },
    include: { answerWord: true },
  });

  if (!existingTodayWord) {
    const todayWord = answerWords[Math.floor(Math.random() * answerWords.length)];
    let answerWord = await prisma.answerWord.findUnique({
      where: { word: todayWord },
    });
    if (!answerWord) {
      answerWord = await prisma.answerWord.create({
        data: { word: todayWord, source: "curated" },
      });
    }
    await prisma.word.create({
      data: {
        answerWordId: answerWord.id,
        dateUsed: today,
        createdBy: admin.id,
      },
    });
    console.log(`Set today's word for ${todayStr}: ${todayWord}`);
  } else {
    console.log(`Word for ${todayStr} already set: ${existingTodayWord.answerWord.word} (skipping to preserve consistency)`);
  }

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
