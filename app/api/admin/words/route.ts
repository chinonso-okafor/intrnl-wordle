import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidWordSync } from "@/lib/words";
import { logAdminAction, AdminActions } from "@/lib/admin-logger";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const words = await prisma.word.findMany({
      include: { answerWord: true },
      orderBy: { dateUsed: "desc" },
      take: 100,
    });

    return NextResponse.json({
      words: words.map((w) => ({
        id: w.id,
        word: w.answerWord?.word || "UNKNOWN",
        dateUsed: w.dateUsed.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching words:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { word, date } = await request.json();

    if (!word || word.length !== 5) {
      return NextResponse.json({ error: "Word must be 5 letters" }, { status: 400 });
    }

    const wordUpper = word.toUpperCase();

    // Check if word exists in answer words table
    let answerWord = await prisma.answerWord.findUnique({
      where: { word: wordUpper },
    });

    if (!answerWord) {
      // Check if it's a valid word first
      const { isValidWordSync } = await import("@/lib/words");
      if (!isValidWordSync(wordUpper)) {
        return NextResponse.json({ 
          error: "Not a valid word" 
        }, { status: 400 });
      }
      
      // Create answer word if it doesn't exist (supplemental)
      answerWord = await prisma.answerWord.create({
        data: {
          word: wordUpper,
          source: "supplemental",
        },
      });
    }

    const wordDate = new Date(date);
    wordDate.setHours(0, 0, 0, 0);

    // Check if word already exists for this date
    const existing = await prisma.word.findUnique({
      where: { dateUsed: wordDate },
    });

    if (existing) {
      // Update existing word
      const updated = await prisma.word.update({
        where: { id: existing.id },
        data: {
          answerWordId: answerWord.id,
          createdBy: session.user.id as string,
        },
        include: { answerWord: true },
      });

      // Log admin action
      await logAdminAction(session.user.id as string, AdminActions.SET_WORD, {
        word: wordUpper,
        date: wordDate.toISOString(),
        action: "updated",
      });

      return NextResponse.json({ word: updated });
    } else {
      // Create new word
      const newWord = await prisma.word.create({
        data: {
          answerWordId: answerWord.id,
          dateUsed: wordDate,
          createdBy: session.user.id as string,
        },
        include: { answerWord: true },
      });

      // Log admin action
      await logAdminAction(session.user.id as string, AdminActions.SET_WORD, {
        word: wordUpper,
        date: wordDate.toISOString(),
        action: "created",
      });

      return NextResponse.json({ word: newWord });
    }
  } catch (error: any) {
    console.error("Error setting word:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Word already exists for this date" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
