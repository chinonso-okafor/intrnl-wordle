export type LetterState = "correct" | "present" | "absent";

export interface LetterEvaluation {
  letter: string;
  state: LetterState;
}

export function evaluateGuess(guess: string, target: string): LetterEvaluation[] {
  const result: LetterEvaluation[] = [];
  const targetArray = target.split("");
  const guessArray = guess.split("");
  const targetLetterCounts: Record<string, number> = {};
  const usedIndices = new Set<number>();

  // Count letters in target word
  for (const letter of targetArray) {
    targetLetterCounts[letter] = (targetLetterCounts[letter] || 0) + 1;
  }

  // First pass: mark correct positions (green)
  for (let i = 0; i < guessArray.length; i++) {
    if (guessArray[i] === targetArray[i]) {
      result[i] = { letter: guessArray[i], state: "correct" };
      usedIndices.add(i);
      targetLetterCounts[guessArray[i]]--;
    }
  }

  // Second pass: mark present letters (yellow)
  for (let i = 0; i < guessArray.length; i++) {
    if (usedIndices.has(i)) continue;

    const letter = guessArray[i];
    if (targetLetterCounts[letter] > 0) {
      result[i] = { letter, state: "present" };
      targetLetterCounts[letter]--;
    } else {
      result[i] = { letter, state: "absent" };
    }
  }

  return result;
}

export async function calculatePoints(attempts: number, solved: boolean, streakDays: number): Promise<number> {
  // Load settings from database
  const { prisma } = await import("./db");
  
  const settings = await prisma.appSettings.findMany();
  const settingsMap: Record<string, any> = {
    streakBonus3Day: 2,
    streakBonus7Day: 5,
    streakBonus30Day: 10,
    baseSolvePoints: 10,
    failedAttemptPoints: 5,
    attemptBonus1: 5,
    attemptBonus2: 4,
    attemptBonus3: 3,
    attemptBonus4: 2,
    attemptBonus5: 1,
    attemptBonus6: 1,
  };

  settings.forEach((s) => {
    try {
      settingsMap[s.key] = JSON.parse(s.value);
    } catch {
      settingsMap[s.key] = s.value;
    }
  });

  if (!solved) {
    return settingsMap.failedAttemptPoints || 5;
  }

  // Base points for solving
  let points = settingsMap.baseSolvePoints || 10;

  // Attempt bonus
  const attemptBonuses: Record<number, number> = {
    1: settingsMap.attemptBonus1 || 5,
    2: settingsMap.attemptBonus2 || 4,
    3: settingsMap.attemptBonus3 || 3,
    4: settingsMap.attemptBonus4 || 2,
    5: settingsMap.attemptBonus5 || 1,
    6: settingsMap.attemptBonus6 || 1,
  };

  points += attemptBonuses[attempts] || 0;

  // Streak bonuses (cumulative)
  if (streakDays >= 30) {
    points += settingsMap.streakBonus30Day || 10;
  } else if (streakDays >= 7) {
    points += settingsMap.streakBonus7Day || 5;
  } else if (streakDays >= 3) {
    points += settingsMap.streakBonus3Day || 2;
  }

  return points;
}

export function generateEmojiGrid(guesses: string[], target: string): string {
  return guesses
    .map((guess) => {
      const evaluation = evaluateGuess(guess, target);
      return evaluation
        .map((evaluationItem) => {
          if (evaluationItem.state === "correct") return "🟩";
          if (evaluationItem.state === "present") return "🟨";
          return "⬛";
        })
        .join("");
    })
    .join("\n");
}
