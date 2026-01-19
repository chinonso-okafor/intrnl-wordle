import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidWord } from "@/lib/words";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const words = await prisma.word.findMany({
      orderBy: { dateUsed: "desc" },
      take: 100,
    });

    return NextResponse.json({
      words: words.map((w) => ({
        id: w.id,
        word: w.word,
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

    if (!isValidWord(word)) {
      return NextResponse.json({ error: "Not a valid word" }, { status: 400 });
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
          word: word.toUpperCase(),
          createdBy: session.user.id as string,
        },
      });

      return NextResponse.json({ word: updated });
    } else {
      // Create new word
      const newWord = await prisma.word.create({
        data: {
          word: word.toUpperCase(),
          dateUsed: wordDate,
          createdBy: session.user.id as string,
        },
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
