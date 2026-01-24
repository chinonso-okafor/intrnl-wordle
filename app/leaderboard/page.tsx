"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
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

function LeaderboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState(searchParams.get("period") || "weekly");
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const loadLeaderboard = useCallback(async () => {
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
  }, [period]);

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
  }, [status, router, loadLeaderboard]);

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

  const periods = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "alltime", label: "All-Time" },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-wordle-background dark:bg-gray-900 transition-colors">
        <div className="text-lg font-medium dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden min-h-screen bg-wordle-background dark:bg-gray-900 transition-colors">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-wordle-text dark:text-white">Leaderboard</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setPeriod(p.value);
                router.push(`/leaderboard?period=${p.value}`);
              }}
              className={`px-4 py-2 rounded-md font-medium whitespace-nowrap transition-colors ${
                period === p.value
                  ? "bg-wordle-correct text-white shadow-md"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th 
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("rank")}
                  >
                    <div className="flex items-center gap-1">
                      Rank
                      <SortIcon field="rank" />
                    </div>
                  </th>
                  <th 
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Player
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th 
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("totalPoints")}
                  >
                    <div className="flex items-center gap-1">
                      Points
                      <SortIcon field="totalPoints" />
                    </div>
                  </th>
                  <th 
                    className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("gamesPlayed")}
                  >
                    <div className="flex items-center gap-1">
                      Games
                      <SortIcon field="gamesPlayed" />
                    </div>
                  </th>
                  <th 
                    className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("winRate")}
                  >
                    <div className="flex items-center gap-1">
                      Win Rate
                      <SortIcon field="winRate" />
                    </div>
                  </th>
                  <th 
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("currentStreak")}
                  >
                    <div className="flex items-center gap-1">
                      Streak
                      <SortIcon field="currentStreak" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                {sortedLeaderboard.map((entry) => {
                  const medal = getMedalIcon(entry.rank);
                  const isCurrentUser = entry.userId === session?.user?.id;
                  return (
                    <tr
                      key={entry.userId}
                      className={`transition-colors ${
                        isCurrentUser
                          ? "bg-wordle-correct/10 dark:bg-wordle-correct/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {medal && <span className="text-xl">{medal}</span>}
                          <span>{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[120px] sm:max-w-none">
                            {entry.name}
                            {isCurrentUser && " (You)"}
                          </span>
                          <span className="sm:hidden text-[10px] text-gray-500 dark:text-gray-400">
                            {entry.gamesPlayed} games
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {entry.totalPoints}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {entry.gamesPlayed}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {entry.winRate}%
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {entry.currentStreak > 0 ? (
                          <span className="text-wordle-present font-semibold">
                            🔥 {entry.currentStreak}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sortedLeaderboard.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No games played yet in this period.
            </div>
          )}
        </div>
      </div>
    </div>
  );
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LeaderboardContent />
    </Suspense>
  );
}
