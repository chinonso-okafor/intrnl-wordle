import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDate } from "@/lib/utils";
import { calculatePoints } from "@/lib/game";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { guess } = await request.json();

    if (!guess || typeof guess !== "string" || guess.length !== 5) {
      return NextResponse.json({ error: "Invalid guess" }, { status: 400 });
    }

    const today = new Date(getTodayDate());
    today.setHours(0, 0, 0, 0);

    // Get today's word with answer word
    const word = await prisma.word.findUnique({
      where: { dateUsed: today },
      include: { answerWord: true },
    });

    if (!word || !word.answerWord) {
      return NextResponse.json({ error: "No word set for today" }, { status: 400 });
    }

    const targetWord = word.answerWord.word.toUpperCase();
    
    // Validate guess server-side
    const { isValidWord } = await import("@/lib/validation-words");
    if (!isValidWord(guess)) {
      return NextResponse.json({ error: "Not a valid word" }, { status: 400 });
    }

    // Check if guess matches target (server-side validation)
    const solved = guess.toUpperCase() === targetWord;

    // Check if user already has a game today
    const existingGame = await prisma.game.findUnique({
      where: {
        userId_date: {
          userId: session.user.id as string,
          date: today,
        },
      },
    });

    if (existingGame) {
      // Update existing game
      const currentGuesses = JSON.parse(existingGame.guesses || "[]");
      const newGuesses = [...currentGuesses, guess.toUpperCase()];
      const attempts = newGuesses.length;

      // Get user's streak for point calculation
      const streak = await prisma.streak.findUnique({
        where: { userId: session.user.id as string },
      });

      const streakDays = streak?.currentStreak || 0;
      const points = await calculatePoints(attempts, solved, streakDays);

      const updatedGame = await prisma.game.update({
        where: { id: existingGame.id },
        data: {
          guesses: JSON.stringify(newGuesses),
          attempts,
          solved,
          points,
        },
      });

      // Update streak if solved
      if (solved) {
        await updateStreak(session.user.id as string, today);
      }

      // Return evaluation for the guess (for frontend display)
      const { evaluateGuess } = await import("@/lib/game");
      const evaluation = evaluateGuess(guess.toUpperCase(), targetWord);

      return NextResponse.json({ 
        game: {
          ...updatedGame,
          guesses: newGuesses,
        },
        evaluation: evaluation.map(e => e.state),
        solved,
      });
    } else {
      // Create new game
      const attempts = 1;
      const newGuesses = [guess.toUpperCase()];
      
      // Get user's streak for point calculation
      const streak = await prisma.streak.findUnique({
        where: { userId: session.user.id as string },
      });

      const streakDays = streak?.currentStreak || 0;
      const points = await calculatePoints(attempts, solved, streakDays);

      const newGame = await prisma.game.create({
        data: {
          userId: session.user.id as string,
          wordId: word.id,
          date: today,
          guesses: JSON.stringify(newGuesses),
          attempts,
          solved,
          points,
        },
      });

      // Update streak if solved
      if (solved) {
        await updateStreak(session.user.id as string, today);
      }

      // Return evaluation for the guess (for frontend display)
      const { evaluateGuess } = await import("@/lib/game");
      const evaluation = evaluateGuess(guess.toUpperCase(), targetWord);

      return NextResponse.json({ 
        game: {
          ...newGame,
          guesses: newGuesses,
        },
        evaluation: evaluation.map(e => e.state),
        solved,
      });
    }
  } catch (error) {
    console.error("Error submitting guess:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function updateStreak(userId: string, today: Date) {
  const streak = await prisma.streak.findUnique({
    where: { userId },
  });

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!streak) {
    // First game
    await prisma.streak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastPlayed: today,
      },
    });
  } else {
    const lastPlayed = new Date(streak.lastPlayed);
    lastPlayed.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    let newCurrentStreak = 1;

    if (lastPlayed.getTime() === yesterday.getTime()) {
      // Continuing streak
      newCurrentStreak = streak.currentStreak + 1;
    } else if (lastPlayed.getTime() === today.getTime()) {
      // Already played today, don't update streak
      return;
    }
    // Otherwise, streak broken, start at 1

    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

    await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastPlayed: today,
      },
    });
  }
}
