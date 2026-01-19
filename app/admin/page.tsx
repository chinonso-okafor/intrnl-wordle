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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"words" | "users" | "stats">("words");
  const [words, setWords] = useState<Word[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newWord, setNewWord] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

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
    } else if (activeTab === "users") {
      loadUsers();
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

        <div className="flex gap-2 mb-6 border-b">
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
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold mb-4">Set Daily Word</h2>
              <div className="flex gap-4">
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
