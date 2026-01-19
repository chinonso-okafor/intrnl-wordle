"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  totalGames: number;
  winPercentage: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  avgGuesses: number;
  distribution: Record<number, number>;
}

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadStats();
    }
  }, [status, router]);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load stats");
    }
  };

  if (status === "loading" || !stats) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const chartData = Object.entries(stats.distribution).map(([attempts, count]) => ({
    attempts: `${attempts}`,
    count,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Statistics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Games</h3>
            <p className="text-3xl font-bold text-wordle-text">{stats.totalGames}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Win Percentage</h3>
            <p className="text-3xl font-bold text-wordle-correct">{stats.winPercentage}%</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Current Streak</h3>
            <p className="text-3xl font-bold text-wordle-present">{stats.currentStreak}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Longest Streak</h3>
            <p className="text-3xl font-bold text-wordle-present">{stats.longestStreak}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Points</h3>
            <p className="text-3xl font-bold text-wordle-correct">{stats.totalPoints}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Guesses</h3>
            <p className="text-3xl font-bold text-wordle-text">{stats.avgGuesses}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Guess Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attempts" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6AAA64" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
