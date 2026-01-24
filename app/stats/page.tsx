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
    return (
      <div className="flex items-center justify-center min-h-screen bg-wordle-background dark:bg-gray-900 transition-colors">
        <div className="text-lg font-medium dark:text-white">Loading...</div>
      </div>
    );
  }

  const chartData = Object.entries(stats.distribution).map(([attempts, count]) => ({
    attempts: `${attempts}`,
    count,
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden min-h-screen bg-wordle-background dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-wordle-text dark:text-white">Your Statistics</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Total Games</h3>
            <p className="text-3xl font-bold text-wordle-text dark:text-white">{stats.totalGames}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Win Percentage</h3>
            <p className="text-3xl font-bold text-wordle-correct">{stats.winPercentage}%</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Current Streak</h3>
            <p className="text-3xl font-bold text-wordle-present">{stats.currentStreak}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Longest Streak</h3>
            <p className="text-3xl font-bold text-wordle-present">{stats.longestStreak}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Total Points</h3>
            <p className="text-3xl font-bold text-wordle-correct">{stats.totalPoints}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Avg Guesses</h3>
            <p className="text-3xl font-bold text-wordle-text dark:text-white">{stats.avgGuesses}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg transition-colors border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Guess Distribution</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis 
                  dataKey="attempts" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                  itemStyle={{ color: '#6AAA64' }}
                  cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#6AAA64" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
