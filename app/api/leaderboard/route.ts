import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStartOfWeek, getStartOfMonth, getStartOfQuarter, getStartOfYear } from "@/lib/utils";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "weekly";

    let startDate: Date;
    const now = new Date();

    switch (period) {
      case "weekly":
        startDate = getStartOfWeek(now);
        break;
      case "monthly":
        startDate = getStartOfMonth(now);
        break;
      case "quarterly":
        startDate = getStartOfQuarter(now);
        break;
      case "yearly":
        startDate = getStartOfYear(now);
        break;
      case "alltime":
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = getStartOfWeek(now);
    }

    // Get all users with their games in the period
    const users = await prisma.user.findMany({
      include: {
        games: {
          where: {
            date: period === "alltime" ? undefined : { gte: startDate },
          },
        },
        streaks: true,
      },
    });

    // Calculate leaderboard stats for each user
    const leaderboard = users
      .map((user) => {
        const games = user.games;
        const solvedGames = games.filter((g) => g.solved);
        const totalPoints = games.reduce((sum, g) => sum + g.points, 0);
        const winRate = games.length > 0 ? (solvedGames.length / games.length) * 100 : 0;

        return {
          userId: user.id,
          name: user.name,
          totalPoints,
          gamesPlayed: games.length,
          winRate: Math.round(winRate * 10) / 10,
          currentStreak: user.streaks?.currentStreak || 0,
        };
      })
      .filter((entry) => entry.gamesPlayed > 0) // Only show users who have played
      .sort((a, b) => {
        // Sort by total points, then by win rate
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.winRate - a.winRate;
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return NextResponse.json({ leaderboard, period });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
