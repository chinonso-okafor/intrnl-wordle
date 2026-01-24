import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Words ending in 'S' that are NOT plurals and should be allowed as answers
const NON_PLURAL_S_WORDS = new Set([
  "ABYSS", "AMISS", "BLISS", "BRASS", "CHESS", "CLASS", "DROSS", "GLASS", "GRASS", "GUESS",
  "CROSS", "GLOSS", "ROSSA", "BLESS", "FLOSS", "PRESS", "DRESS", "TRUSS", "FOCUS", "ETHOS",
  "CHAOS", "AXIS", "BASIS", "LOCUS", "VIRUS", "BONUS", "MINUS", "LOTUS", "REBUS"
]);

async function main() {
  console.log("Starting smart seed...");

  const answersPath = path.join(process.cwd(), "answers.txt");
  const allowedPath = path.join(process.cwd(), "allowed.txt");

  if (!fs.existsSync(answersPath) || !fs.existsSync(allowedPath)) {
    throw new Error("Word lists not found. Please run the download commands first.");
  }

  const rawAnswers = fs.readFileSync(answersPath, "utf-8").split("\n").filter(Boolean);
  const rawAllowed = fs.readFileSync(allowedPath, "utf-8").split("\n").filter(Boolean);

  console.log(`Read ${rawAnswers.length} answer candidates and ${rawAllowed.length} allowed guesses.`);

  const answerWords: string[] = [];
  const initialValidationWords: string[] = [...rawAllowed.map(w => w.toUpperCase())];

  for (const word of rawAnswers) {
    const upperWord = word.toUpperCase();
    
    // Logic: If it ends in S and is not in our "keep" list, it's a validation-only word (likely a plural)
    if (upperWord.endsWith("S") && !NON_PLURAL_S_WORDS.has(upperWord)) {
      initialValidationWords.push(upperWord);
    } else {
      answerWords.push(upperWord);
    }
  }

  // Ensure uniqueness: ValidationWords should not include AnswerWords
  const answerSet = new Set(answerWords);
  const validationOnlyWords = Array.from(new Set(initialValidationWords.filter(w => !answerSet.has(w))));

  console.log(`Processing complete: ${answerWords.length} AnswerWords, ${validationOnlyWords.length} ValidationWords.`);

  // Clear existing words to ensure a clean start
  console.log("Clearing existing words...");
  await prisma.word.deleteMany({}); // Delete daily words first due to foreign keys
  await prisma.answerWord.deleteMany({});
  await prisma.validationWord.deleteMany({});

  // Seed AnswerWords
  console.log("Seeding AnswerWord table...");
  const answerData = answerWords.map(word => ({
    word,
    source: "nyt"
  }));

  // Chunking to avoid database limits
  const chunkSize = 1000;
  for (let i = 0; i < answerData.length; i += chunkSize) {
    const chunk = answerData.slice(i, i + chunkSize);
    await prisma.answerWord.createMany({
      data: chunk,
    });
    console.log(`  Seeded ${Math.min(i + chunkSize, answerData.length)}/${answerData.length} AnswerWords...`);
  }

  // Seed ValidationWords
  console.log("Seeding ValidationWord table...");
  const validationData = validationOnlyWords.map(word => ({
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

  // Pick a random word from our new answer words
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
      await prisma.word.create({
        data: {
          answerWordId: answerWordRecord.id,
          dateUsed: today,
          createdBy: admin.id,
        },
      });
      console.log(`Today's word set to: ${randomAnswer}`);
    } else {
      console.log("No admin user found. Please set today's word manually in the admin panel.");
    }
  }

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
