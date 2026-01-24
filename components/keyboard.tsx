"use client";

import { LetterState } from "@/lib/game";

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  letterStates: Record<string, LetterState>;
}

const KEYBOARD_LAYOUT = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

export function Keyboard({
  onKeyPress,
  onEnter,
  onBackspace,
  letterStates,
}: KeyboardProps) {
  const getKeyColor = (key: string) => {
    const state = letterStates[key.toUpperCase()];
    if (!state) return "bg-gray-200 hover:bg-gray-300";
    if (state === "correct") return "bg-wordle-correct text-white";
    if (state === "present") return "bg-wordle-present text-white";
    return "bg-wordle-absent text-white";
  };

  const handleKeyClick = (key: string) => {
    if (key === "ENTER") {
      onEnter();
    } else if (key === "BACKSPACE") {
      onBackspace();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-8 w-full max-w-full px-2">
      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 justify-center flex-wrap">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyClick(key)}
              className={`px-2 sm:px-3 py-3 rounded font-semibold text-xs sm:text-sm ${
                key === "ENTER" || key === "BACKSPACE"
                  ? "bg-gray-400 hover:bg-gray-500 text-white min-w-[50px] sm:min-w-[60px]"
                  : `min-w-[32px] sm:min-w-[40px] ${getKeyColor(key)}`
              }`}
            >
              {key === "BACKSPACE" ? "⌫" : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
