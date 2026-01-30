import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStartOfWeek, dateStringToUTCMidnight } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayDateStr = now.toISOString().split("T")[0];
    const startOfTodayUTC = dateStringToUTCMidnight(todayDateStr);
    const endOfTodayUTC = new Date(startOfTodayUTC);
    endOfTodayUTC.setUTCDate(endOfTodayUTC.getUTCDate() + 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const [
      totalUsers,
      gamesToday,
      totalGames,
      gamesSolved,
      activeUserIdsLast7Days,
      streakCountGte1,
      participationLast30Days,
      guessDistributionRaw,
      topPerformersGames,
      streakLeaders,
      wordPerformanceRaw,
      wordBankStats,
      recentActivities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.game.count({
        where: {
          date: { gte: startOfTodayUTC, lt: endOfTodayUTC },
        },
      }),
      prisma.game.count(),
      prisma.game.count({ where: { solved: true } }),
      prisma.game.findMany({
        where: { date: { gte: sevenDaysAgo } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.streak.count({ where: { currentStreak: { gte: 1 } } }),
      prisma.game.groupBy({
        by: ["date"],
        where: { date: { gte: thirtyDaysAgo } },
        _count: { userId: true },
      }),
      prisma.game.groupBy({
        by: ["attempts"],
        _count: { id: true },
      }),
      prisma.game.findMany({
        where: { date: { gte: startOfWeek, lt: endOfWeek } },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.streak.findMany({
        where: { currentStreak: { gte: 1 } },
        orderBy: { currentStreak: "desc" },
        take: 5,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.game.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        include: {
          word: {
            include: { answerWord: { select: { word: true } } },
          },
        },
      }),
      Promise.all([
        prisma.answerWord.count(),
        prisma.word.count(),
      ]),
      prisma.adminActivityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { admin: { select: { name: true } } },
      }),
    ]);

    const activePlayers7d = activeUserIdsLast7Days.length;
    const activePlayersPct = totalUsers > 0 ? Math.round((activePlayers7d / totalUsers) * 1000) / 10 : 0;
    const avgWinRate = totalGames > 0 ? Math.round((gamesSolved / totalGames) * 1000) / 10 : 0;

    const allUserIds = await prisma.user.findMany({ select: { id: true, name: true } });

    const participationChart = participationLast30Days
      .map((p) => {
        const pct = totalUsers > 0 ? Math.round((p._count.userId / totalUsers) * 1000) / 10 : 0;
        return { date: p.date.toISOString().split("T")[0], participation: pct, players: p._count.userId };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const todayChartPoint =
      participationChart.find((p) => p.date === todayDateStr) ?? (participationChart.length > 0 ? participationChart[participationChart.length - 1] : undefined);
    const todayPlayersFromChart = todayChartPoint?.players ?? 0;
    const todayParticipationPct = totalUsers > 0 ? Math.round((todayPlayersFromChart / totalUsers) * 1000) / 10 : 0;

    const latestDateStr = todayChartPoint?.date;
    let notPlayedToday: { id: string; name: string }[] = allUserIds.map((u) => ({ id: u.id, name: u.name }));
    if (latestDateStr) {
      const latestDateStart = dateStringToUTCMidnight(latestDateStr);
      const latestDateEnd = new Date(latestDateStart);
      latestDateEnd.setUTCDate(latestDateEnd.getUTCDate() + 1);
      const playedOnLatestDate = await prisma.game.findMany({
        where: { date: { gte: latestDateStart, lt: latestDateEnd } },
        select: { userId: true },
        distinct: ["userId"],
      });
      const playedIdSet = new Set(playedOnLatestDate.map((g) => g.userId));
      notPlayedToday = allUserIds.filter((u) => !playedIdSet.has(u.id)).map((u) => ({ id: u.id, name: u.name }));
    }

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let failedCount = 0;
    guessDistributionRaw.forEach((g) => {
      if (g.attempts >= 1 && g.attempts <= 6) dist[g.attempts] = g._count.id;
      else failedCount += g._count.id;
    });
    const solvedTotal = Object.values(dist).reduce((a, b) => a + b, 0);
    const guessDistribution = [1, 2, 3, 4, 5, 6].map((attempts) => {
      const count = dist[attempts];
      const pct = totalGames > 0 ? Math.round((count / totalGames) * 1000) / 10 : 0;
      return { attempts, count, pct, label: `${attempts}` };
    });
    const failedPct = totalGames > 0 ? Math.round((failedCount / totalGames) * 1000) / 10 : 0;
    guessDistribution.push({ attempts: 0, count: failedCount, pct: failedPct, label: "Failed" });
    const mostCommonAttempt = [...guessDistribution].filter((d) => d.label !== "Failed").sort((a, b) => b.count - a.count)[0];
    const avgGuessesPerWin =
      solvedTotal > 0
        ? Math.round(([1, 2, 3, 4, 5, 6].reduce((s, a) => s + dist[a] * a, 0) / solvedTotal) * 10) / 10
        : 0;

    const pointsByUser = new Map<string, { name: string; points: number; games: number; attempts: number[] }>();
    topPerformersGames.forEach((g) => {
      const u = pointsByUser.get(g.userId) || { name: g.user.name, points: 0, games: 0, attempts: [] as number[] };
      u.points += g.points;
      u.games += 1;
      if (g.solved) u.attempts.push(g.attempts);
      pointsByUser.set(g.userId, u);
    });
    const topFiveUserIds = [...pointsByUser.entries()]
      .sort((a, b) => b[1].points - a[1].points)
      .slice(0, 5)
      .map(([userId]) => userId);
    const streaksForTop = await prisma.streak.findMany({
      where: { userId: { in: topFiveUserIds } },
      select: { userId: true, currentStreak: true },
    });
    const streakByUserId = new Map(streaksForTop.map((s) => [s.userId, s.currentStreak]));
    const topPerformers = [...pointsByUser.entries()]
      .map(([userId, v]) => ({
        name: v.name,
        points: v.points,
        games: v.games,
        currentStreak: streakByUserId.get(userId) ?? 0,
        avgGuesses: v.attempts.length > 0 ? Math.round((v.attempts.reduce((a, b) => a + b, 0) / v.attempts.length) * 10) / 10 : null,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    const streakLeaderList = streakLeaders.map((s) => ({
      userId: s.userId,
      name: s.user.name,
      currentStreak: s.currentStreak,
    }));

    const last10Words = await prisma.word.findMany({
      orderBy: { dateUsed: "desc" },
      take: 10,
      include: { answerWord: { select: { word: true } } },
    });
    const wordPerfByDate = last10Words.map((w) => {
      const gamesForWord = wordPerformanceRaw.filter((g) => g.wordId === w.id);
      const wins = gamesForWord.filter((g) => g.solved).length;
      const total = gamesForWord.length;
      const attempts = gamesForWord.filter((g) => g.solved).map((g) => g.attempts);
      return {
        word: w.answerWord.word,
        dateUsed: w.dateUsed.toISOString().split("T")[0],
        winRate: total > 0 ? Math.round((wins / total) * 1000) / 10 : 0,
        avgGuesses: attempts.length > 0 ? Math.round((attempts.reduce((a, b) => a + b, 0) / attempts.length) * 10) / 10 : null,
        games: total,
      };
    });

    const [totalAnswerWords, usedWords] = wordBankStats;
    const availableWords = totalAnswerWords - usedWords;
    const daysInPeriod = Math.max(1, Math.ceil((Date.now() - thirtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000)));
    const avgDailyUsage = usedWords > 0 ? usedWords / daysInPeriod : 0;
    const estimatedRunway = avgDailyUsage > 0 ? Math.floor(availableWords / avgDailyUsage) : null;

    const engagementWeeks: { weekLabel: string; start: Date; end: Date }[] = [];
    for (let i = 3; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const start = getStartOfWeek(end);
      const endWeek = new Date(start);
      endWeek.setDate(endWeek.getDate() + 7);
      engagementWeeks.push({
        weekLabel: `Week ${4 - i}`,
        start,
        end: endWeek,
      });
    }
    const weeklyStats = await Promise.all(
      engagementWeeks.map(async (w) => {
        const gamesInWeek = await prisma.game.findMany({
          where: { date: { gte: w.start, lt: w.end } },
          select: { userId: true },
          distinct: ["userId"],
        });
        const participationPct = totalUsers > 0 ? Math.round((gamesInWeek.length / totalUsers) * 1000) / 10 : 0;
        const gameCount = await prisma.game.count({
          where: { date: { gte: w.start, lt: w.end } },
        });
        return { weekLabel: w.weekLabel, participation: participationPct, games: gameCount };
      })
    );
    const trend = weeklyStats.length >= 2 ? weeklyStats[weeklyStats.length - 1].participation - weeklyStats[weeklyStats.length - 2].participation : 0;
    const trendLabel = trend > 0 ? "growing" : trend < 0 ? "declining" : "stable";
    const pctChange =
      weeklyStats.length >= 2 && weeklyStats[weeklyStats.length - 2].participation > 0
        ? Math.round((trend / weeklyStats[weeklyStats.length - 2].participation) * 1000) / 10
        : 0;

    const activities = recentActivities.map((a) => ({
      id: a.id,
      action: a.action,
      details: (() => {
        try {
          return typeof a.details === "string" ? JSON.parse(a.details) : a.details ?? {};
        } catch {
          return {};
        }
      })(),
      adminName: a.admin?.name ?? "Unknown",
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({
      overview: {
        totalUsers,
        activePlayers7d,
        activePlayers7dPct: activePlayersPct,
        gamesToday,
        totalGames,
        avgWinRate,
        playersWithActiveStreak: streakCountGte1,
      },
      todayParticipation: {
        played: todayPlayersFromChart,
        total: totalUsers,
        pct: todayParticipationPct,
        notPlayedToday: notPlayedToday.slice(0, 50),
      },
      participationChart,
      guessDistribution: { items: guessDistribution, mostCommon: mostCommonAttempt?.label ?? "—", avgGuessesPerWin },
      topPerformers,
      engagementTrends: { weekly: weeklyStats, trend: trendLabel, pctChange },
      streakLeaders: streakLeaderList,
      atRiskCount: notPlayedToday.length,
      wordPerformance: wordPerfByDate,
      wordBank: {
        total: totalAnswerWords,
        used: usedWords,
        remaining: availableWords,
        estimatedRunwayDays: estimatedRunway,
        warning: availableWords < 100,
      },
      recentActivity: activities,
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
