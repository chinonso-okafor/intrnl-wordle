// In-memory Set for O(1) word validation lookup
// This Set contains all valid words that can be guessed (~12,000 words)

let validationWordsSet: Set<string> | null = null;

export async function initializeValidationWords(): Promise<Set<string>> {
  if (validationWordsSet) {
    return validationWordsSet;
  }

  // Load from database
  const { prisma } = await import("./db");
  const validationWords = await prisma.validationWord.findMany({
    select: { word: true },
  });

  // Also include answer words as valid guesses
  const { initializeAnswerWords } = await import("./answer-words");
  const answerSet = await initializeAnswerWords();

  // Also include the legacy hardcoded list as a base to ensure common words are never missed
  const { VALID_WORDS } = await import("./words");

  validationWordsSet = new Set([
    ...validationWords.map((vw) => vw.word.toUpperCase()),
    ...Array.from(answerSet),
    ...VALID_WORDS.map((w) => w.toUpperCase()),
  ]);

  return validationWordsSet;
}

export function getValidationWordsSet(): Set<string> | null {
  return validationWordsSet;
}

export function isValidWord(word: string): boolean {
  if (!validationWordsSet) {
    // Fallback to old validation if not initialized
    const { VALID_WORDS } = require("./words");
    return VALID_WORDS.includes(word.toUpperCase());
  }
  return validationWordsSet.has(word.toUpperCase());
}

export function refreshValidationWordsSet(): void {
  validationWordsSet = null;
}
