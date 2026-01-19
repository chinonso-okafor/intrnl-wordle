import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id as string;

    // Get all games for user
    const games = await prisma.game.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    // Get streak info
    const streak = await prisma.streak.findUnique({
      where: { userId },
    });

    // Calculate stats
    const totalGames = games.length;
    const solvedGames = games.filter((g) => g.solved);
    const winPercentage = totalGames > 0 ? (solvedGames.length / totalGames) * 100 : 0;
    const totalPoints = games.reduce((sum, g) => sum + g.points, 0);
    
    // Average guesses per win
    const solvedAttempts = solvedGames.map((g) => g.attempts);
    const avgGuesses = solvedAttempts.length > 0
      ? solvedAttempts.reduce((sum, a) => sum + a, 0) / solvedAttempts.length
      : 0;

    // Distribution of guesses
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    solvedGames.forEach((g) => {
      distribution[g.attempts] = (distribution[g.attempts] || 0) + 1;
    });

    return NextResponse.json({
      totalGames,
      winPercentage: Math.round(winPercentage * 10) / 10,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      totalPoints,
      avgGuesses: Math.round(avgGuesses * 10) / 10,
      distribution,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
