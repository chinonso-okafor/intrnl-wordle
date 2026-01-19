"use client";

import { motion } from "framer-motion";
import { LetterState } from "@/lib/game";

interface TileProps {
  letter: string;
  state?: LetterState;
  isActive: boolean;
  delay?: number;
}

function Tile({ letter, state, isActive, delay = 0 }: TileProps) {
  const getBgColor = () => {
    if (!state) return "bg-white border-2 border-gray-300";
    if (state === "correct") return "bg-wordle-correct text-white";
    if (state === "present") return "bg-wordle-present text-white";
    return "bg-wordle-absent text-white";
  };

  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={isActive && state ? { rotateX: [0, 90, 0] } : {}}
      transition={{ duration: 0.6, delay }}
      className={`flex h-14 w-14 items-center justify-center rounded border-2 font-bold text-xl ${
        state ? getBgColor() : "border-gray-300 bg-white"
      } ${letter ? "border-gray-400" : ""}`}
    >
      {letter.toUpperCase()}
    </motion.div>
  );
}

interface GameBoardProps {
  guesses: string[];
  evaluations: LetterState[][];
  currentGuess: string;
  maxAttempts?: number;
}

export function GameBoard({
  guesses,
  evaluations,
  currentGuess,
  maxAttempts = 6,
}: GameBoardProps) {
  const rows = Array.from({ length: maxAttempts }, (_, i) => {
    const guess = guesses[i] || "";
    const evaluation = evaluations[i] || [];
    const isCurrentRow = i === guesses.length;
    const displayGuess = isCurrentRow ? currentGuess : guess;

    return (
      <div key={i} className="flex gap-2 justify-center">
        {Array.from({ length: 5 }, (_, j) => (
          <Tile
            key={j}
            letter={displayGuess[j] || ""}
            state={evaluation[j]}
            isActive={!isCurrentRow && !!evaluation[j]}
            delay={j * 0.1}
          />
        ))}
      </div>
    );
  });

  return <div className="flex flex-col gap-2">{rows}</div>;
}
