"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { generateEmojiGrid } from "@/lib/game";
import toast from "react-hot-toast";

interface GameResult {
  game: {
    guesses: string[];
    attempts: number;
    solved: boolean;
    points: number;
  };
  word: string;
  dayNumber: number;
}

export default function GameResultPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [result, setResult] = useState<GameResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadResult();
    }
  }, [status, router]);

  const loadResult = async () => {
    try {
      const response = await fetch("/api/game/result");
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        router.push("/game");
      }
    } catch (error) {
      router.push("/game");
    }
  };

  const handleShare = async () => {
    if (!result) return;

    const emojiGrid = generateEmojiGrid(result.game.guesses, result.word);
    const shareText = `Wordle ${result.dayNumber} ${result.game.solved ? result.game.attempts : "X"}/6 - ${result.game.points} points\n\n${emojiGrid}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("Results copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleReportWord = async () => {
    if (!reportReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setReporting(true);
    try {
      const response = await fetch("/api/game/report-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });

      if (response.ok) {
        toast.success("Word reported successfully. Thank you for your feedback!");
        setShowReportModal(false);
        setReportReason("");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to report word");
      }
    } catch (error) {
      toast.error("Failed to report word");
    } finally {
      setReporting(false);
    }
  };

  if (status === "loading" || !result) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">
          {result.game.solved ? "🎉 Congratulations!" : "Better luck tomorrow!"}
        </h1>

        <div className="bg-white rounded-lg p-6 shadow-lg mb-6 w-full">
          <div className="text-center mb-4">
            <p className="text-lg font-semibold">Wordle {result.dayNumber}</p>
            <p className="text-sm text-gray-600">
              {result.game.solved
                ? `Solved in ${result.game.attempts} ${result.game.attempts === 1 ? "try" : "tries"}`
                : "Not solved"}
            </p>
            <p className="text-lg font-bold text-wordle-correct mt-2">
              {result.game.points} points
            </p>
          </div>

          <div className="bg-gray-100 rounded p-4 mb-4 font-mono text-center whitespace-pre-line">
            {generateEmojiGrid(result.game.guesses, result.word)}
          </div>

          {!result.game.solved && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">The word was:</p>
              <p className="text-2xl font-bold text-wordle-text">{result.word}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 rounded-md bg-wordle-correct px-4 py-2 font-medium text-white hover:bg-opacity-90"
            >
              {copied ? "✓ Copied!" : "Share Results"}
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex-1 rounded-md bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
            >
              Report This Word
            </button>
          </div>
        </div>

        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Report This Word</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please tell us why you're reporting this word. Your feedback helps improve the game.
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="e.g., offensive, inappropriate, not a real word..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 min-h-[100px]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason("");
                  }}
                  className="flex-1 rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
                  disabled={reporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportWord}
                  className="flex-1 rounded-md bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
                  disabled={reporting}
                >
                  {reporting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => router.push("/stats")}
            className="rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
          >
            View Stats
          </button>
          <button
            onClick={() => router.push("/leaderboard")}
            className="rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
