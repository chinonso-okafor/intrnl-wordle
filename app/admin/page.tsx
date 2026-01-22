"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
}

interface WordStats {
  totalAnswerWords: number;
  nytWords: number;
  supplementalWords: number;
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
  const [newWord, setNewWord] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"answer" | "validation">("answer");

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
    } else if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "activity") {
      loadActivities();
    } else if (activeTab === "settings") {
      loadSettings();
    } else if (activeTab === "moderation") {
      loadReports();
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
      }
    } catch (error) {
      console.error("Failed to load users");
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
        loadWordStats();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to import words");
      }
    } catch (error) {
      toast.error("Failed to import words");
    }
  };

  const handleProcessReport = async (reportId: string, action: "approve" | "reject" | "remove") => {
    try {
      const response = await fetch("/api/admin/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      });

      if (response.ok) {
        toast.success(`Report ${action}d successfully`);
        loadReports();
        loadWordStats();
      } else {
        toast.error("Failed to process report");
      }
    } catch (error) {
      toast.error("Failed to process report");
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
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
        loadWords();
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        <div className="flex gap-2 mb-6 border-b flex-wrap">
          <button
            onClick={() => setActiveTab("words")}
            className={`px-4 py-2 font-medium ${
              activeTab === "words"
                ? "border-b-2 border-wordle-correct text-wordle-correct"
                : "text-gray-600"
            }`}
          >
            Word Management
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium ${
              activeTab === "users"
                ? "border-b-2 border-wordle-correct text-wordle-correct"
                : "text-gray-600"
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab("moderation")}
            className={`px-4 py-2 font-medium ${
              activeTab === "moderation"
                ? "border-b-2 border-wordle-correct text-wordle-correct"
                : "text-gray-600"
            }`}
          >
            Moderation
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 font-medium ${
              activeTab === "settings"
                ? "border-b-2 border-wordle-correct text-wordle-correct"
                : "text-gray-600"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 font-medium ${
              activeTab === "activity"
                ? "border-b-2 border-wordle-correct text-wordle-correct"
                : "text-gray-600"
            }`}
          >
            Activity Log
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2 font-medium ${
              activeTab === "stats"
                ? "border-b-2 border-wordle-correct text-wordle-correct"
                : "text-gray-600"
            }`}
          >
            Statistics
          </button>
        </div>

        {activeTab === "words" && (
          <div className="space-y-6">
            {wordStats && wordStats.exhaustionWarning && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Warning:</strong> Only {wordStats.availableWords} answer words remaining!
                      Please add more words to the answer bank.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {wordStats && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-xl font-bold mb-4">Word Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Answer Words</p>
                    <p className="text-2xl font-bold">{wordStats.totalAnswerWords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">NYT Words</p>
                    <p className="text-2xl font-bold">{wordStats.nytWords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Supplemental</p>
                    <p className="text-2xl font-bold">{wordStats.supplementalWords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available</p>
                    <p className={`text-2xl font-bold ${wordStats.exhaustionWarning ? "text-red-600" : ""}`}>
                      {wordStats.availableWords}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold mb-4">Set Daily Word</h2>
              <div className="flex gap-4 flex-wrap">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value.toUpperCase())}
                  placeholder="5-letter word"
                  maxLength={5}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={handleSetWord}
                  className="px-4 py-2 bg-wordle-correct text-white rounded-md hover:bg-opacity-90"
                >
                  Set Word
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold mb-4">Import/Export Words</h2>
              <div className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={() => handleExportWords("answer")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Export Answer Words
                  </button>
                  <button
                    onClick={() => handleExportWords("validation")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Export Validation Words
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/admin/words/fetch-nyt", {
                          method: "POST",
                        });
                        if (response.ok) {
                          const data = await response.json();
                          toast.success(`Fetched ${data.fetched} NYT words. Imported ${data.imported}.`);
                          loadWordStats();
                        } else {
                          const errorData = await response.json();
                          toast.error(errorData.error || "Failed to fetch NYT words");
                        }
                      } catch (error) {
                        toast.error("Failed to fetch NYT words");
                      }
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                  >
                    Fetch NYT Words
                  </button>
                </div>
                <div className="flex gap-4 items-end flex-wrap">
                  <div>
                    <label className="block text-sm font-medium mb-2">Import Type</label>
                    <select
                      value={importType}
                      onChange={(e) => setImportType(e.target.value as "answer" | "validation")}
                      className="px-4 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="answer">Answer Words</option>
                      <option value="validation">Validation Words</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <button
                    onClick={handleImportWords}
                    disabled={!importFile}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                  >
                    Import Words
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <h2 className="text-xl font-bold p-6 border-b">Word History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Word
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {words.map((word) => (
                      <tr key={word.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {word.word}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(word.dateUsed).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteWord(word.id)}
                            className="text-red-600 hover:text-red-800"
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h2 className="text-xl font-bold p-6 border-b">All Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded ${
                            user.role === "ADMIN"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <div className="bg-white rounded-lg p-6 shadow space-y-6">
            <h2 className="text-xl font-bold">Game Settings</h2>
            
            <div>
              <h3 className="font-semibold mb-3">Streak Bonuses</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">3-Day Streak</label>
                  <input
                    type="number"
                    value={settings.streakBonus3Day}
                    onChange={(e) => setSettings({...settings, streakBonus3Day: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">7-Day Streak</label>
                  <input
                    type="number"
                    value={settings.streakBonus7Day}
                    onChange={(e) => setSettings({...settings, streakBonus7Day: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">30-Day Streak</label>
                  <input
                    type="number"
                    value={settings.streakBonus30Day}
                    onChange={(e) => setSettings({...settings, streakBonus30Day: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Point Values</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Base Solve Points</label>
                  <input
                    type="number"
                    value={settings.baseSolvePoints}
                    onChange={(e) => setSettings({...settings, baseSolvePoints: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Failed Attempt Points</label>
                  <input
                    type="number"
                    value={settings.failedAttemptPoints}
                    onChange={(e) => setSettings({...settings, failedAttemptPoints: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Attempt Bonuses</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((attempt) => (
                  <div key={attempt}>
                    <label className="block text-sm font-medium mb-1">Guess {attempt}</label>
                    <input
                      type="number"
                      value={settings[`attemptBonus${attempt}` as keyof Settings] as number}
                      onChange={(e) => setSettings({...settings, [`attemptBonus${attempt}`]: parseInt(e.target.value) || 0} as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Daily Reset</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Reset Time (UTC)</label>
                  <input
                    type="time"
                    value={settings.dailyResetTime}
                    onChange={(e) => setSettings({...settings, dailyResetTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <input
                    type="text"
                    value={settings.timezone}
                    onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                    placeholder="UTC"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Feature Toggles</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.featureWordReporting}
                    onChange={(e) => setSettings({...settings, featureWordReporting: e.target.checked})}
                    className="mr-2"
                  />
                  <span>Word Reporting</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.featureLeaderboard}
                    onChange={(e) => setSettings({...settings, featureLeaderboard: e.target.checked})}
                    className="mr-2"
                  />
                  <span>Leaderboard</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="px-6 py-2 bg-wordle-correct text-white rounded-md hover:bg-opacity-90"
            >
              Save Settings
            </button>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h2 className="text-xl font-bold p-6 border-b">Admin Activity Log</h2>
            <div className="overflow-x-auto">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No activity logged</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activities.map((activity) => (
                      <tr key={activity.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{activity.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.admin.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-bold mb-4">Admin Statistics</h2>
            <p className="text-gray-600">Statistics dashboard coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
