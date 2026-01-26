import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get total answer words
    const totalAnswerWords = await prisma.answerWord.count();

    // Get words already used
    const usedWords = await prisma.word.count();

    // Get available words (not yet used)
    const availableWords = totalAnswerWords - usedWords;

    // Check for exhaustion warning
    const exhaustionWarning = availableWords < 100;

    return NextResponse.json({
      totalAnswerWords,
      usedWords,
      availableWords,
      exhaustionWarning,
    });
  } catch (error) {
    console.error("Error fetching word stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
