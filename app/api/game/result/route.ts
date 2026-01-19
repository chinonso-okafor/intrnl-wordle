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

    const game = await prisma.game.findUnique({
      where: {
        userId_date: {
          userId: session.user.id as string,
          date: today,
        },
      },
      include: {
        word: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: "No game found" }, { status: 404 });
    }

    // Calculate day number (days since first game or a fixed start date)
    const startDate = new Date("2024-01-01");
    const dayNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Parse guesses from JSON string
    const guesses = JSON.parse(game.guesses || "[]");

    return NextResponse.json({
      game: {
        guesses,
        attempts: game.attempts,
        solved: game.solved,
        points: game.points,
      },
      word: game.word.word,
      dayNumber,
    });
  } catch (error) {
    console.error("Error fetching game result:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
