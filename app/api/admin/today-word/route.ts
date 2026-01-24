import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDate } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date(getTodayDate());
    today.setHours(0, 0, 0, 0);

    // Get today's word
    const word = await prisma.word.findUnique({
      where: { dateUsed: today },
      include: { answerWord: true },
    });

    if (!word || !word.answerWord) {
      return NextResponse.json({ 
        error: "No word set for today",
        todayWord: null 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      todayWord: word.answerWord.word,
      date: word.dateUsed,
      source: word.answerWord.source
    });
  } catch (error) {
    console.error("Error fetching today's word:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
