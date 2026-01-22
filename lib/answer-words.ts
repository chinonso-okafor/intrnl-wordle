// In-memory Set for O(1) answer word lookup
// This Set contains words that can be used as daily puzzle answers (~2,500 words)

let answerWordsSet: Set<string> | null = null;

export async function initializeAnswerWords(): Promise<Set<string>> {
  if (answerWordsSet) {
    return answerWordsSet;
  }

  // Load from database
  const { prisma } = await import("./db");
  const answerWords = await prisma.answerWord.findMany({
    select: { word: true },
  });

  answerWordsSet = new Set(answerWords.map((aw) => aw.word.toUpperCase()));
  return answerWordsSet;
}

export function getAnswerWordsSet(): Set<string> | null {
  return answerWordsSet;
}

export async function isAnswerWord(word: string): Promise<boolean> {
  const set = await initializeAnswerWords();
  return set.has(word.toUpperCase());
}

export function refreshAnswerWordsSet(): void {
  answerWordsSet = null;
}

// Get random answer word
export async function getRandomAnswerWord(): Promise<string | null> {
  const set = await initializeAnswerWords();
  if (set.size === 0) {
    return null;
  }
  const words = Array.from(set);
  return words[Math.floor(Math.random() * words.length)];
}

// Get count of available answer words
export async function getAnswerWordCount(): Promise<number> {
  const set = await initializeAnswerWords();
  return set.size;
}
