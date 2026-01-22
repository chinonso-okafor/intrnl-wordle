import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAnswerWordCount } from "@/lib/answer-words";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get total answer words
    const totalAnswerWords = await prisma.answerWord.count();
    
    // Get words by source
    const nytWords = await prisma.answerWord.count({
      where: { source: "nyt" },
    });
    
    const supplementalWords = await prisma.answerWord.count({
      where: { source: "supplemental" },
    });

    // Get words already used
    const usedWords = await prisma.word.count();

    // Get available words (not yet used)
    const availableWords = totalAnswerWords - usedWords;

    // Get in-memory count (may differ if Sets are initialized)
    const inMemoryCount = await getAnswerWordCount();

    // Check for exhaustion warning
    const exhaustionWarning = availableWords < 100;

    return NextResponse.json({
      totalAnswerWords,
      nytWords,
      supplementalWords,
      usedWords,
      availableWords,
      inMemoryCount,
      exhaustionWarning,
      exhaustionThreshold: 100,
    });
  } catch (error) {
    console.error("Error fetching word stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
