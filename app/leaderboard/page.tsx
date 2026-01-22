"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  totalPoints: number;
  gamesPlayed: number;
  winRate: number;
  currentStreak: number;
}

type SortField = "rank" | "name" | "totalPoints" | "gamesPlayed" | "winRate" | "currentStreak";
type SortDirection = "asc" | "desc";

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState(searchParams.get("period") || "weekly");
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadLeaderboard();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadLeaderboard();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [status, router, period]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to descending for most fields
    }
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle string sorting
    if (sortField === "name") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === "asc" ? <span>↑</span> : <span>↓</span>;
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "alltime", label: "All-Time" },
  ];

  if (status === "loading" || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setPeriod(p.value);
                router.push(`/leaderboard?period=${p.value}`);
              }}
              className={`px-4 py-2 rounded-md font-medium ${
                period === p.value
                  ? "bg-wordle-correct text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("rank")}
                >
                  <div className="flex items-center gap-1">
                    Rank
                    <SortIcon field="rank" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Player
                    <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("totalPoints")}
                >
                  <div className="flex items-center gap-1">
                    Points
                    <SortIcon field="totalPoints" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("gamesPlayed")}
                >
                  <div className="flex items-center gap-1">
                    Games
                    <SortIcon field="gamesPlayed" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("winRate")}
                >
                  <div className="flex items-center gap-1">
                    Win Rate
                    <SortIcon field="winRate" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("currentStreak")}
                >
                  <div className="flex items-center gap-1">
                    Streak
                    <SortIcon field="currentStreak" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedLeaderboard.map((entry) => {
                const medal = getMedalIcon(entry.rank);
                return (
                  <tr
                    key={entry.userId}
                    className={
                      entry.userId === session?.user?.id
                        ? "bg-wordle-correct bg-opacity-10"
                        : ""
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {medal && <span className="text-xl">{medal}</span>}
                        <span>{entry.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.name}
                      {entry.userId === session?.user?.id && " (You)"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.totalPoints}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.gamesPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.winRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.currentStreak > 0 && (
                        <span className="text-wordle-present font-semibold">
                          🔥 {entry.currentStreak}
                        </span>
                      )}
                      {entry.currentStreak === 0 && <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedLeaderboard.length === 0 && (
            <div className="text-center py-8 text-gray-500">No games played yet in this period.</div>
          )}
        </div>
      </div>
    </div>
  );
}
