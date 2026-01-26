import { PrismaClient } from "@prisma/client";
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
  console.log("Starting smart seed with curated word lists...");
  console.log(`Answer words: ${CURATED_ANSWER_WORDS.length} common, recognizable words`);
  console.log(`Validation words: ${CURATED_VALIDATION_WORDS.length} valid guesses`);

  // Prepare answer words (normalize to uppercase)
  const answerWords = CURATED_ANSWER_WORDS.map(w => w.toUpperCase());
  const answerSet = new Set(answerWords);

  // Prepare validation words (exclude answer words to avoid duplicates)
  const validationOnlyWords = CURATED_VALIDATION_WORDS
    .map(w => w.toUpperCase())
    .filter(w => !answerSet.has(w));

  // Remove duplicates
  const uniqueValidationWords = Array.from(new Set(validationOnlyWords));

  console.log(`Processing complete: ${answerWords.length} AnswerWords, ${uniqueValidationWords.length} ValidationWords.`);

  // Clear existing words to ensure a clean start
  console.log("Clearing existing words...");
  await prisma.word.deleteMany({}); // Delete daily words first due to foreign keys
  await prisma.answerWord.deleteMany({});
  await prisma.validationWord.deleteMany({});

  // Seed AnswerWords
  console.log("Seeding AnswerWord table...");
  const answerData = answerWords.map(word => ({
    word,
    source: "curated"
  }));

  // Chunking to avoid database limits
  const chunkSize = 500;
  for (let i = 0; i < answerData.length; i += chunkSize) {
    const chunk = answerData.slice(i, i + chunkSize);
    await prisma.answerWord.createMany({
      data: chunk,
    });
    console.log(`  Seeded ${Math.min(i + chunkSize, answerData.length)}/${answerData.length} AnswerWords...`);
  }

  // Seed ValidationWords
  console.log("Seeding ValidationWord table...");
  const validationData = uniqueValidationWords.map(word => ({
    word
  }));

  for (let i = 0; i < validationData.length; i += chunkSize) {
    const chunk = validationData.slice(i, i + chunkSize);
    await prisma.validationWord.createMany({
      data: chunk,
    });
    console.log(`  Seeded ${Math.min(i + chunkSize, validationData.length)}/${validationData.length} ValidationWords...`);
  }

  // Set today's word
  console.log("Setting today's word...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Pick a random word from our curated answer words
  const randomAnswer = answerWords[Math.floor(Math.random() * answerWords.length)];
  const answerWordRecord = await prisma.answerWord.findUnique({
    where: { word: randomAnswer }
  });

  if (answerWordRecord) {
    // Get an admin user to attribute the creation to
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (admin) {
      // Check if today's word already exists
      const existingWord = await prisma.word.findUnique({
        where: { dateUsed: today }
      });

      if (!existingWord) {
        await prisma.word.create({
          data: {
            answerWordId: answerWordRecord.id,
            dateUsed: today,
            createdBy: admin.id,
          },
        });
        console.log(`Today's word set to: ${randomAnswer}`);
      } else {
        console.log("Today's word already exists, skipping...");
      }
    } else {
      console.log("No admin user found. Please set today's word manually in the admin panel.");
    }
  }

  // Print summary
  const finalAnswerCount = await prisma.answerWord.count();
  const finalValidationCount = await prisma.validationWord.count();
  
  console.log("\n=== Seed Summary ===");
  console.log(`Answer words (daily puzzles): ${finalAnswerCount}`);
  console.log(`Validation words (valid guesses): ${finalValidationCount}`);
  console.log(`Total unique valid words: ${finalAnswerCount + finalValidationCount}`);
  console.log("Smart seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
