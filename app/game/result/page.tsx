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

          <button
            onClick={handleShare}
            className="w-full rounded-md bg-wordle-correct px-4 py-2 font-medium text-white hover:bg-opacity-90"
          >
            {copied ? "✓ Copied!" : "Share Results"}
          </button>
        </div>

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
