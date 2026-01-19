"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GameBoard } from "@/components/game-board";
import { Keyboard } from "@/components/keyboard";
import { evaluateGuess, LetterState, LetterEvaluation } from "@/lib/game";
import { isValidWord } from "@/lib/words";
import toast from "react-hot-toast";

export default function GamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<LetterState[][]>([]);
  const [targetWord, setTargetWord] = useState("");
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadGame();
    }
  }, [status, router]);

  const loadGame = async () => {
    try {
      const response = await fetch("/api/game/current");
      if (response.ok) {
        const data = await response.json();
        if (data.game) {
          setGuesses(data.game.guesses || []);
          setTargetWord(data.word);
          if (data.game.solved) {
            setGameState("won");
          } else if (data.game.attempts >= 6) {
            setGameState("lost");
          }
          // Recalculate evaluations
          const guessList = data.game.guesses || [];
          const evals = guessList.map((guess: string) =>
            evaluateGuess(guess, data.word).map((e) => e.state)
          );
          setEvaluations(evals);
          const fullEvals = guessList.map((guess: string) =>
            evaluateGuess(guess, data.word)
          );
          updateLetterStates(fullEvals);
        } else {
          setTargetWord(data.word);
        }
      }
    } catch (error) {
      toast.error("Failed to load game");
    }
  };

  const updateLetterStates = (evals: LetterEvaluation[][]) => {
    const states: Record<string, LetterState> = {};
    evals.forEach((evaluation) => {
      evaluation.forEach(({ letter, state }) => {
        const upper = letter.toUpperCase();
        if (!states[upper] || state === "correct") {
          states[upper] = state;
        } else if (state === "present" && states[upper] !== "correct") {
          states[upper] = state;
        }
      });
    });
    setLetterStates(states);
  };

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState !== "playing") return;
      if (currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + key.toUpperCase());
      }
    },
    [currentGuess, gameState]
  );

  const handleEnter = useCallback(async () => {
    if (currentGuess.length !== 5) {
      toast.error("Word must be 5 letters");
      return;
    }

    if (!isValidWord(currentGuess)) {
      toast.error("Not a valid word");
      return;
    }

    const evaluation = evaluateGuess(currentGuess, targetWord);
    const newGuesses = [...guesses, currentGuess];
    const newEvaluations = [...evaluations, evaluation.map((e) => e.state)];

    setGuesses(newGuesses);
    setEvaluations(newEvaluations);
    
    // Reconstruct full evaluations for letter state updates
    const allFullEvaluations = newGuesses.map((guess) => 
      evaluateGuess(guess, targetWord)
    );
    updateLetterStates(allFullEvaluations);

    const solved = currentGuess.toUpperCase() === targetWord.toUpperCase();

    try {
      const response = await fetch("/api/game/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guess: currentGuess,
          solved,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit guess");
      }

      const data = await response.json();

      if (solved) {
        setGameState("won");
        toast.success(`Congratulations! You solved it in ${newGuesses.length} tries!`);
        setTimeout(() => {
          router.push("/game/result");
        }, 2000);
      } else if (newGuesses.length >= 6) {
        setGameState("lost");
        toast.error(`The word was ${targetWord}`);
        setTimeout(() => {
          router.push("/game/result");
        }, 2000);
      } else {
        setCurrentGuess("");
      }
    } catch (error) {
      toast.error("Failed to submit guess");
    }
  }, [currentGuess, targetWord, guesses, evaluations, router]);

  const handleBackspace = useCallback(() => {
    if (gameState !== "playing") return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleEnter();
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress, handleEnter, handleBackspace]);

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!targetWord) {
    return <div className="flex items-center justify-center min-h-screen">Loading game...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-8">Daily Wordle</h1>
        <GameBoard
          guesses={guesses}
          evaluations={evaluations}
          currentGuess={currentGuess}
        />
        <Keyboard
          onKeyPress={handleKeyPress}
          onEnter={handleEnter}
          onBackspace={handleBackspace}
          letterStates={letterStates}
        />
      </div>
    </div>
  );
}
