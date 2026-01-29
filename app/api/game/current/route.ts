import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDateForTimezone, getTimezoneFromRequest } from "@/lib/utils";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timezone = getTimezoneFromRequest(request);
  const todayStr = getTodayDateForTimezone(timezone);

  try {
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0);

    // Get or create today's word
    let word = await prisma.word.findUnique({
      where: { dateUsed: today },
      include: { answerWord: true },
    });

    if (!word) {
      // If no word for today, try to get a random answer word (admin should set this, but fallback)
      const { getRandomAnswerWord } = await import("@/lib/answer-words");
      const randomWord = await getRandomAnswerWord();
      
      if (!randomWord) {
        return NextResponse.json({ error: "No answer words available. Please add words via admin panel." }, { status: 500 });
      }

      // Get or create answer word
      let answerWord = await prisma.answerWord.findUnique({
        where: { word: randomWord },
      });

      if (!answerWord) {
        answerWord = await prisma.answerWord.create({
          data: {
            word: randomWord,
            source: "supplemental",
          },
        });
      }

      word = await prisma.word.create({
        data: {
          answerWordId: answerWord.id,
          dateUsed: today,
          createdBy: session.user.id,
        },
        include: { answerWord: true },
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
