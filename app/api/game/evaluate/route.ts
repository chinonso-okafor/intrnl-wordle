import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDateForTimezone, getTimezoneFromRequest } from "@/lib/utils";
import { evaluateGuess } from "@/lib/game";

// Endpoint to get evaluation for guesses without revealing the word
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timezone = getTimezoneFromRequest(request);

  try {
    const { guesses } = await request.json();

    if (!Array.isArray(guesses)) {
      return NextResponse.json({ error: "Invalid guesses" }, { status: 400 });
    }

    const todayStr = getTodayDateForTimezone(timezone);
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0);

    // Get today's word
    const word = await prisma.word.findUnique({
      where: { dateUsed: today },
      include: { answerWord: true },
    });

    if (!word || !word.answerWord) {
      return NextResponse.json({ error: "No word set for today" }, { status: 400 });
    }

    const targetWord = word.answerWord.word.toUpperCase();

    // Return evaluations for all guesses
    const evaluations = guesses.map((guess: string) => 
      evaluateGuess(guess.toUpperCase(), targetWord).map(e => e.state)
    );

    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error("Error evaluating guesses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
