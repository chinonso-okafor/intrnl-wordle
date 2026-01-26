// Legacy word list - uses curated lists for fallback and initial seeding
// New system uses AnswerWord and ValidationWord models with in-memory Sets
import { CURATED_ANSWER_WORDS } from "./curated-answer-words";

// Load validation words from JSON file (server-side only)
// On client-side, this will be undefined and we'll use database validation instead
let CURATED_VALIDATION_WORDS: string[] = [];
let VALID_WORDS: string[] = [];

// Only load JSON file on server-side (Node.js environment)
if (typeof window === "undefined" && typeof require !== "undefined") {
  try {
    const fs = require("fs");
    const path = require("path");
    const validationWordsPath = path.join(__dirname, "curated-validation-words.json");
    CURATED_VALIDATION_WORDS = JSON.parse(
      fs.readFileSync(validationWordsPath, "utf-8")
    );
  } catch (e) {
    // If JSON file can't be loaded, use answer words only
    console.warn("Could not load validation words JSON:", e);
  }
}

// Combine answer words and validation words for the fallback valid words list
// On client-side, this will only contain answer words
VALID_WORDS = [
  ...CURATED_ANSWER_WORDS,
  ...CURATED_VALIDATION_WORDS.filter(w => !CURATED_ANSWER_WORDS.includes(w))
];

// Export for use in seed scripts and server-side code
export { VALID_WORDS };

// Use new validation system if available, fallback to legacy list
export async function isValidWord(word: string): Promise<boolean> {
  try {
    const { isValidWord: newIsValidWord } = await import("./validation-words");
    return newIsValidWord(word);
  } catch {
    // Fallback to legacy validation
    return VALID_WORDS.includes(word.toUpperCase());
  }
}

// Synchronous version for backward compatibility (uses legacy list)
// On client-side, this uses only answer words (smaller list but still functional)
// For full validation, use the async isValidWord() which queries the database
export function isValidWordSync(word: string): boolean {
  const upperWord = word.toUpperCase();
  // On client-side, VALID_WORDS only contains answer words
  // This provides basic validation - full validation happens server-side
  return VALID_WORDS.includes(upperWord);
}
