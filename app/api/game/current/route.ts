import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDate } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date(getTodayDate());
    today.setHours(0, 0, 0, 0);

    // Get or create today's word
    let word = await prisma.word.findUnique({
      where: { dateUsed: today },
    });

    if (!word) {
      // If no word for today, create one (admin should set this, but fallback)
      const { VALID_WORDS } = await import("@/lib/words");
      const randomWord = VALID_WORDS[Math.floor(Math.random() * VALID_WORDS.length)];
      
      word = await prisma.word.create({
        data: {
          word: randomWord,
          dateUsed: today,
          createdBy: session.user.id,
        },
      });
    }

    // Get user's game for today
    const game = await prisma.game.findUnique({
      where: {
        userId_date: {
          userId: session.user.id as string,
          date: today,
        },
      },
    });

    // Parse guesses from JSON string if game exists
    const gameData = game ? {
      ...game,
      guesses: JSON.parse(game.guesses || "[]"),
    } : null;

    // SECURITY: Never return the word to frontend - only return wordId
    // The word is only revealed after game completion in /api/game/result
    return NextResponse.json({
      wordId: word.id,
      game: gameData,
    });
  } catch (error) {
    console.error("Error fetching current game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
