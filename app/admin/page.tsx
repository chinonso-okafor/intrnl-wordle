"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Word {
  id: string;
  word: string;
  dateUsed: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface WordStats {
  totalAnswerWords: number;
  usedWords: number;
  availableWords: number;
  exhaustionWarning: boolean;
}

interface Activity {
  id: string;
  action: string;
  details: any;
  admin: { name: string; email: string };
  createdAt: string;
}

interface Report {
  id: string;
  word: string;
  reason: string;
  status: string;
  user: { name: string; email: string };
  createdAt: string;
}

interface Settings {
  streakBonus3Day: number;
  streakBonus7Day: number;
  streakBonus30Day: number;
  baseSolvePoints: number;
  failedAttemptPoints: number;
  attemptBonus1: number;
  attemptBonus2: number;
  attemptBonus3: number;
  attemptBonus4: number;
  attemptBonus5: number;
  attemptBonus6: number;
  dailyResetTime: string;
  timezone: string;
  featureWordReporting: boolean;
  featureLeaderboard: boolean;
}

interface TodayWord {
  todayWord: string;
  date: string;
  source: string;
}

interface AdminStatistics {
  overview: {
    totalUsers: number;
    activePlayers7d: number;
    activePlayers7dPct: number;
    gamesToday: number;
    totalGames: number;
    avgWinRate: number;
    playersWithActiveStreak: number;
  };
  todayParticipation: {
    played: number;
    total: number;
    pct: number;
    notPlayedToday: { id: string; name: string }[];
  };
  participationChart: { date: string; participation: number; players: number }[];
  guessDistribution: {
    items: { attempts: number; count: number; pct: number; label: string }[];
    mostCommon: string;
    avgGuessesPerWin: number;
  };
  topPerformers: { name: string; points: number; games: number; currentStreak: number; avgGuesses: number | null }[];
  engagementTrends: {
    weekly: { weekLabel: string; participation: number; games: number }[];
    trend: string;
    pctChange: number;
  };
  streakLeaders: { userId: string; name: string; currentStreak: number }[];
  atRiskCount: number;
  wordPerformance: {
    word: string;
    dateUsed: string;
    winRate: number;
    avgGuesses: number | null;
    games: number;
  }[];
  wordBank: {
    total: number;
    used: number;
    remaining: number;
    estimatedRunwayDays: number | null;
    warning: boolean;
  };
  recentActivity: {
    id: string;
    action: string;
    details: Record<string, unknown>;
    adminName: string;
    createdAt: string;
  }[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"words" | "users" | "stats" | "activity" | "settings" | "moderation">("words");
  const [words, setWords] = useState<Word[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [wordStats, setWordStats] = useState<WordStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [todayWord, setTodayWord] = useState<TodayWord | null>(null);
  const [newWord, setNewWord] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"answer" | "validation">("answer");
  const [statsData, setStatsData] = useState<AdminStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.push("/game");
        return;
      }
      loadData();
    }
  }, [status, router, session]);

  const loadData = async () => {
    if (activeTab === "words") {
      loadWords();
      loadWordStats();
      loadTodayWord();
    } else if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "activity") {
      loadActivities();
    } else if (activeTab === "settings") {
      loadSettings();
    } else if (activeTab === "moderation") {
      loadReports();
    } else if (activeTab === "stats") {
      loadStatistics();
    }
  };

  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/admin/statistics");
      if (response.ok) {
        const data = await response.json();
        setStatsData(data);
      } else {
        setStatsData(null);
        toast.error("Failed to load statistics");
      }
    } catch (error) {
      console.error("Failed to load statistics", error);
      setStatsData(null);
      toast.error("Failed to load statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadWords = async () => {
    try {
      const response = await fetch("/api/admin/words");
      if (response.ok) {
        const data = await response.json();
        setWords(data.words);
      }
    } catch (error) {
      console.error("Failed to load words");
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        console.error("Failed to load users: Non-OK response");
      }
    } catch (error) {
      console.error("Failed to load users: Network error", error);
      // Don't re-throw - let caller decide if they want to handle it
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    toast.dismiss();
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        // Reload to ensure consistency
        await loadUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const loadWordStats = async () => {
    try {
      const response = await fetch("/api/admin/word-stats");
      if (response.ok) {
        const data = await response.json();
        setWordStats(data);
      }
    } catch (error) {
      console.error("Failed to load word stats");
    }
  };

  const loadTodayWord = async () => {
    try {
      const response = await fetch("/api/admin/today-word");
      if (response.ok) {
        const data = await response.json();
        setTodayWord(data);
      } else {
        setTodayWord(null);
      }
    } catch (error) {
      console.error("Failed to load today's word");
      setTodayWord(null);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await fetch("/api/admin/activity");
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
      }
    } catch (error) {
      console.error("Failed to load activities");
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to load settings");
    }
  };

  const loadReports = async () => {
    try {
      const response = await fetch("/api/admin/reports?status=pending");
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Failed to load reports");
    }
  };

  const handleExportWords = async (type: "answer" | "validation") => {
    toast.dismiss();
    try {
      const response = await fetch(`/api/admin/words/export?type=${type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}-words-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Words exported successfully");
      } else {
        toast.error("Failed to export words");
      }
    } catch (error) {
      toast.error("Failed to export words");
    }
  };

  const handleImportWords = async () => {
    if (!importFile) {
      toast.error("Please select a file");
      return;
    }

    toast.dismiss();
    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("type", importType);

    try {
      const response = await fetch("/api/admin/words/import", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Imported ${data.imported} words. ${data.skipped} skipped.`);
        setImportFile(null);
        await loadWordStats();
        await loadTodayWord();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to import words");
      }
    } catch (error) {
      toast.error("Failed to import words");
    }
  };

  const handleProcessReport = async (reportId: string, action: "approve" | "reject" | "remove") => {
    toast.dismiss();
    try {
      const response = await fetch("/api/admin/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      });

      if (response.ok) {
        toast.success(`Report ${action}d successfully`);
        await loadReports();
        await loadWordStats();
      } else {
        toast.error("Failed to process report");
      }
    } catch (error) {
      toast.error("Failed to process report");
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    toast.dismiss();
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
        await loadSettings();
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleSetWord = async () => {
    if (!newWord || newWord.length !== 5) {
      toast.error("Word must be 5 letters");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    toast.dismiss();
    try {
      const response = await fetch("/api/admin/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: newWord.toUpperCase(),
          date: selectedDate,
        }),
      });

      if (response.ok) {
        toast.success("Word set successfully");
        setNewWord("");
        setSelectedDate("");
        await loadWords();
        await loadTodayWord();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to set word");
      }
    } catch (error) {
      toast.error("Failed to set word");
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!confirm("Are you sure you want to delete this word?")) return;

    try {
      const response = await fetch(`/api/admin/words/${wordId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Word deleted");
        loadWords();
      } else {
        toast.error("Failed to delete word");
      }
    } catch (error) {
      toast.error("Failed to delete word");
    }
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-wordle-text dark:text-white">Admin Panel</h1>

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 flex-wrap">
          <button
            onClick={() => setActiveTab("words")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "words"
                ? "border-b-2 border-wordle-correct text-wordle-correct dark:text-wordle-correct"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Word Management
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "users"
                ? "border-b-2 border-wordle-correct text-wordle-correct dark:text-wordle-correct"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab("moderation")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "moderation"
                ? "border-b-2 border-wordle-correct text-wordle-correct dark:text-wordle-correct"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Moderation
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "settings"
                ? "border-b-2 border-wordle-correct text-wordle-correct dark:text-wordle-correct"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "activity"
                ? "border-b-2 border-wordle-correct text-wordle-correct dark:text-wordle-correct"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Activity Log
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "stats"
                ? "border-b-2 border-wordle-correct text-wordle-correct dark:text-wordle-correct"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Statistics
          </button>
        </div>

        {activeTab === "words" && (
          <div className="space-y-6">
            {todayWord && (
              <div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Today's Word</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1">{todayWord.todayWord}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      Source: {todayWord.source} • Date: {new Date(todayWord.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {wordStats && wordStats.exhaustionWarning && (
              <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 rounded">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <strong>Warning:</strong> Only {wordStats.availableWords} answer words remaining!
                      Please add more words to the answer bank.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {wordStats && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Word Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Answer Words</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{wordStats.totalAnswerWords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
                    <p className={`text-2xl font-bold ${wordStats.exhaustionWarning ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                      {wordStats.availableWords}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Set Daily Word</h2>
              <div className="flex gap-4 flex-wrap">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value.toUpperCase())}
                  placeholder="5-letter word"
                  maxLength={5}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct"
                />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct"
                />
                <button
                  onClick={handleSetWord}
                  className="px-4 py-2 bg-wordle-correct text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  Set Word
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Import/Export Words</h2>
              <div className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={() => handleExportWords("answer")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Export Answer Words
                  </button>
                  <button
                    onClick={() => handleExportWords("validation")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Export Validation Words
                  </button>
                </div>
                <div className="flex gap-4 items-end flex-wrap">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Import Type</label>
                    <select
                      value={importType}
                      onChange={(e) => setImportType(e.target.value as "answer" | "validation")}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct"
                    >
                      <option value="answer">Answer Words</option>
                      <option value="validation">Validation Words</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-wordle-correct file:text-white hover:file:bg-opacity-90"
                    />
                  </div>
                  <button
                    onClick={handleImportWords}
                    disabled={!importFile}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    Import Words
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <h2 className="text-xl font-bold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">Word History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Word
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {words.map((word) => (
                      <tr key={word.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {word.word}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {new Date(word.dateUsed).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteWord(word.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add New User</h2>
              <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    toast.dismiss();
                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    const name = formData.get("name") as string;
                    const email = formData.get("email") as string;
                    const password = formData.get("password") as string;
                    const role = formData.get("role") as string;

                    try {
                      const response = await fetch("/api/admin/users", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, email, password, role }),
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        toast.error(data.error || "Failed to create user");
                        return;
                      }

                      // Success
                      toast.success("User created successfully");
                      form.reset();
                      
                      // Refresh user list from server to ensure we have the definitive list
                      await loadUsers();
                    } catch (error) {
                      console.error("Creation error:", error);
                      toast.error("A network error occurred");
                    }
                  }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct"
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <label htmlFor="role" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2 lg:col-span-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-wordle-correct text-white rounded-md hover:bg-opacity-90 transition-colors"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <h2 className="text-xl font-bold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                All Users
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded ${
                              user.role === "ADMIN"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                            aria-label={`Delete user ${user.name}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "moderation" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h2 className="text-xl font-bold p-6 border-b">Word Reports</h2>
            <div className="overflow-x-auto">
              {reports.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No pending reports</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Word</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{report.word}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{report.reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleProcessReport(report.id, "approve")}
                            className="text-green-600 hover:text-green-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessReport(report.id, "reject")}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleProcessReport(report.id, "remove")}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove Word
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && settings && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow space-y-6 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Game Settings</h2>
            
            <div>
              <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Streak Bonuses</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">3-Day Streak</label>
                  <input
                    type="number"
                    value={settings.streakBonus3Day}
                    onChange={(e) => setSettings({...settings, streakBonus3Day: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">7-Day Streak</label>
                  <input
                    type="number"
                    value={settings.streakBonus7Day}
                    onChange={(e) => setSettings({...settings, streakBonus7Day: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">30-Day Streak</label>
                  <input
                    type="number"
                    value={settings.streakBonus30Day}
                    onChange={(e) => setSettings({...settings, streakBonus30Day: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Point Values</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Base Solve Points</label>
                  <input
                    type="number"
                    value={settings.baseSolvePoints}
                    onChange={(e) => setSettings({...settings, baseSolvePoints: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Failed Attempt Points</label>
                  <input
                    type="number"
                    value={settings.failedAttemptPoints}
                    onChange={(e) => setSettings({...settings, failedAttemptPoints: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Attempt Bonuses</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((attempt) => (
                  <div key={attempt}>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Guess {attempt}</label>
                    <input
                      type="number"
                      value={settings[`attemptBonus${attempt}` as keyof Settings] as number}
                      onChange={(e) => setSettings({...settings, [`attemptBonus${attempt}`]: parseInt(e.target.value) || 0} as any)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Daily Reset</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Reset Time (UTC)</label>
                  <input
                    type="time"
                    value={settings.dailyResetTime}
                    onChange={(e) => setSettings({...settings, dailyResetTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Timezone</label>
                  <input
                    type="text"
                    value={settings.timezone}
                    onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                    placeholder="UTC"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-wordle-correct focus:border-wordle-correct transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Feature Toggles</h3>
              <div className="space-y-2">
                <label className="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.featureWordReporting}
                    onChange={(e) => setSettings({...settings, featureWordReporting: e.target.checked})}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-wordle-correct focus:ring-wordle-correct dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span>Word Reporting</span>
                </label>
                <label className="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.featureLeaderboard}
                    onChange={(e) => setSettings({...settings, featureLeaderboard: e.target.checked})}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-wordle-correct focus:ring-wordle-correct dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span>Leaderboard</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="px-6 py-2 bg-wordle-correct text-white rounded-md hover:bg-opacity-90 transition-colors shadow-sm"
            >
              Save Settings
            </button>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
            <h2 className="text-xl font-bold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">Admin Activity Log</h2>
            <div className="overflow-x-auto">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">No activity logged</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {activities.map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{activity.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{activity.admin.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <pre className="text-xs bg-gray-50 dark:bg-gray-900/50 p-2 rounded overflow-auto max-w-md border border-gray-100 dark:border-gray-700">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {new Date(activity.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Statistics Dashboard</h2>
              <button
                type="button"
                onClick={loadStatistics}
                disabled={statsLoading}
                className="px-4 py-2 rounded-md bg-wordle-correct text-white text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors"
              >
                {statsLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {statsLoading && !statsData ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow text-center text-gray-500 dark:text-gray-400">
                Loading statistics...
              </div>
            ) : !statsData ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow text-center text-gray-500 dark:text-gray-400">
                No statistics available.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{statsData.overview.totalUsers}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active (7d)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{statsData.overview.activePlayers7d}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{statsData.overview.activePlayers7dPct}%</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Games Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{statsData.overview.gamesToday}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Games</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{statsData.overview.totalGames}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Win Rate</p>
                    <p className="text-2xl font-bold text-wordle-correct mt-1">{statsData.overview.avgWinRate}%</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Streaks</p>
                    <p className="text-2xl font-bold text-wordle-present mt-1">{statsData.overview.playersWithActiveStreak}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Today&apos;s Participation</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {statsData.todayParticipation.played} out of {statsData.todayParticipation.total} players ({statsData.todayParticipation.pct}%)
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-3">
                    <div
                      className="bg-wordle-correct h-4 rounded-full transition-all"
                      style={{ width: `${Math.min(100, statsData.todayParticipation.pct)}%` }}
                    />
                  </div>
                  {statsData.todayParticipation.notPlayedToday.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                        {statsData.todayParticipation.notPlayedToday.length} haven&apos;t played yet
                      </summary>
                      <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside max-h-32 overflow-y-auto">
                        {statsData.todayParticipation.notPlayedToday.slice(0, 20).map((u) => (
                          <li key={u.id}>{u.name}</li>
                        ))}
                        {statsData.todayParticipation.notPlayedToday.length > 20 && (
                          <li>... and {statsData.todayParticipation.notPlayedToday.length - 20} more</li>
                        )}
                      </ul>
                    </details>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Participation (Last 30 Days)</h3>
                  {statsData.participationChart.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No data yet.</p>
                  ) : (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={statsData.participationChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-gray-500" />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "var(--tw-bg-opacity)", borderRadius: "8px" }}
                            formatter={(value: number) => [`${value}%`, "Participation"]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Line type="monotone" dataKey="participation" stroke="#6AAA64" strokeWidth={2} dot={{ r: 2 }} name="Participation %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Guess Distribution (All Time)</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Most common: {statsData.guessDistribution.mostCommon} guess(es) · Avg guesses per win: {statsData.guessDistribution.avgGuessesPerWin}
                  </p>
                  {statsData.guessDistribution.items.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No data yet.</p>
                  ) : (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsData.guessDistribution.items} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value: number, _name: string, item: { payload?: { count: number; pct: number } }) => [
                              `${value} games (${item.payload?.pct ?? 0}%)`,
                              "Count",
                            ]}
                          />
                          <Bar dataKey="count" fill="#6AAA64" radius={[4, 4, 0, 0]} name="Games" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Performers (This Week)</h3>
                    {statsData.topPerformers.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No games this week.</p>
                    ) : (
                      (() => {
                        const maxStreak = Math.max(...statsData.topPerformers.map((p) => p.currentStreak), 0);
                        return (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-600">
                                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">#</th>
                                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Name</th>
                                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Points</th>
                                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Streak</th>
                                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Avg Guesses</th>
                              </tr>
                            </thead>
                            <tbody>
                              {statsData.topPerformers.map((p, i) => (
                                <tr
                                  key={i}
                                  className={`border-b border-gray-100 dark:border-gray-700/50 ${p.currentStreak === maxStreak && maxStreak > 0 ? "bg-wordle-present/10 dark:bg-wordle-present/10" : ""}`}
                                >
                                  <td className="py-2 text-gray-900 dark:text-white font-medium">{i + 1}</td>
                                  <td className="py-2 text-gray-900 dark:text-white">{p.name}</td>
                                  <td className="py-2 text-right text-wordle-correct font-medium">{p.points}</td>
                                  <td className="py-2 text-right text-wordle-present font-medium">{p.currentStreak}</td>
                                  <td className="py-2 text-right text-gray-600 dark:text-gray-300">{p.avgGuesses ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Active Streak Leaders</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {statsData.atRiskCount} player(s) at risk (haven&apos;t played today)
                    </p>
                    {statsData.streakLeaders.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No active streaks.</p>
                    ) : (
                      <ul className="space-y-2">
                        {statsData.streakLeaders.map((s, i) => (
                          <li key={s.userId} className="flex justify-between items-center text-sm">
                            <span className="text-gray-900 dark:text-white">
                              {i + 1}. {s.name}
                            </span>
                            <span className="font-bold text-wordle-present">{s.currentStreak} day(s)</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Engagement Trends (Last 4 Weeks)</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Trend: <span className={statsData.engagementTrends.trend === "growing" ? "text-wordle-correct" : statsData.engagementTrends.trend === "declining" ? "text-red-500" : "text-gray-500"}>{statsData.engagementTrends.trend}</span>
                    {statsData.engagementTrends.pctChange !== 0 && ` (${statsData.engagementTrends.pctChange > 0 ? "+" : ""}${statsData.engagementTrends.pctChange}%)`}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {statsData.engagementTrends.weekly.map((w, i) => (
                      <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{w.weekLabel}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{w.participation}%</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{w.games} games</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Word Performance (Last 10 Words)</h3>
                  {statsData.wordPerformance.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No words played yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-600">
                            <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Word</th>
                            <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                            <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Win Rate %</th>
                            <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Avg Guesses</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statsData.wordPerformance.map((w, i) => (
                            <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-2 font-medium text-gray-900 dark:text-white">{w.word}</td>
                              <td className="py-2 text-gray-600 dark:text-gray-300">{w.dateUsed}</td>
                              <td className="py-2 text-right text-gray-900 dark:text-white">{w.winRate}%</td>
                              <td className="py-2 text-right text-gray-600 dark:text-gray-300">{w.avgGuesses ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Word Bank Status</h3>
                    {statsData.wordBank.warning && (
                      <div className="mb-4 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 text-sm">
                        Warning: Fewer than 100 words remaining. Consider adding more.
                      </div>
                    )}
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                      <li>Total in bank: <strong>{statsData.wordBank.total}</strong></li>
                      <li>Used: <strong>{statsData.wordBank.used}</strong></li>
                      <li>Remaining: <strong>{statsData.wordBank.remaining}</strong></li>
                      {statsData.wordBank.estimatedRunwayDays != null && (
                        <li>Estimated runway: <strong>{statsData.wordBank.estimatedRunwayDays} days</strong></li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Admin Activity</h3>
                    {statsData.recentActivity.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No activity yet.</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {statsData.recentActivity.map((a) => (
                          <li key={a.id} className="border-b border-gray-100 dark:border-gray-700/50 pb-2 last:border-0">
                            <span className="text-gray-500 dark:text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
                            <span className="mx-1">·</span>
                            <span className="text-gray-900 dark:text-white font-medium">{a.adminName}</span>
                            <span className="mx-1">·</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {a.action}
                              {a.details && typeof a.details === "object" && "word" in a.details && "date" in a.details && (
                                <> &quot;{(a.details as { word?: string }).word}&quot; for {(a.details as { date?: string }).date}</>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
