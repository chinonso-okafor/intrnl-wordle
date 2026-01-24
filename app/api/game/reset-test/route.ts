import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDate } from "@/lib/utils";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if BETA_MODE is enabled
  if (process.env.NEXT_PUBLIC_BETA_MODE !== "true") {
    return NextResponse.json({ error: "Beta mode is not enabled" }, { status: 403 });
  }

  try {
    const today = new Date(getTodayDate());
    today.setHours(0, 0, 0, 0);

    // 1. Get a random word from the bank that is NOT the current word for today
    const currentWordEntry = await prisma.word.findUnique({
      where: { dateUsed: today },
    });

    const totalAnswerWords = await prisma.answerWord.count();
    if (totalAnswerWords === 0) {
      return NextResponse.json({ error: "No answer words in bank" }, { status: 500 });
    }

    const skip = Math.floor(Math.random() * totalAnswerWords);
    const randomAnswerWord = await prisma.answerWord.findFirst({
      skip: skip,
    });

    if (!randomAnswerWord) {
      return NextResponse.json({ error: "Could not find a random word" }, { status: 500 });
    }

    // 2. Update or Create today's word with this new random word
    // This changes the word for EVERYONE in beta mode, which is acceptable for testing the bank
    await prisma.word.upsert({
      where: { dateUsed: today },
      update: {
        answerWordId: randomAnswerWord.id,
      },
      create: {
        answerWordId: randomAnswerWord.id,
        dateUsed: today,
        createdBy: session.user.id as string,
      },
    });

    // 3. Delete ALL games for today to let everyone play the new word
    // In a closed beta, this is the cleanest way to cycle words for testing
    await prisma.game.deleteMany({
      where: { date: today },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Word bank cycled. A new word is ready for today!",
      newWordSource: randomAnswerWord.source
    });
  } catch (error) {
    console.error("Error resetting game for test:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
