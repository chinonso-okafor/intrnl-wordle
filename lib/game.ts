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

export function calculatePoints(attempts: number, solved: boolean, streakDays: number): number {
  if (!solved) {
    return 5; // Failed attempt base points
  }

  // Base points for solving
  let points = 10;

  // Attempt bonus
  const attemptBonuses: Record<number, number> = {
    1: 5,
    2: 4,
    3: 3,
    4: 2,
    5: 1,
    6: 1,
  };

  points += attemptBonuses[attempts] || 0;

  // Streak bonuses (cumulative)
  if (streakDays >= 30) {
    points += 10;
  } else if (streakDays >= 7) {
    points += 5;
  } else if (streakDays >= 3) {
    points += 2;
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
