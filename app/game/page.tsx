"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GameBoard } from "@/components/game-board";
import { Keyboard } from "@/components/keyboard";
import { LetterState, LetterEvaluation } from "@/lib/game";
import { getClientTimezone } from "@/lib/utils";
import { isValidWordSync } from "@/lib/words";
import toast from "react-hot-toast";

export default function GamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<LetterState[][]>([]);
  const [wordId, setWordId] = useState<string | null>(null);
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
    // If status is "loading", do nothing - wait for auth to resolve
  }, [status, router]);

  const loadGame = async () => {
    try {
      const response = await fetch("/api/game/current", {
        headers: { "X-Timezone": getClientTimezone() },
      });
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to load game");
        return;
      }
      
      const data = await response.json();
      
      if (!data.wordId) {
        toast.error("No word available for today");
        return;
      }
      
      setWordId(data.wordId);
      
      if (data.game) {
        const guessList = data.game.guesses || [];
        setGuesses(guessList);
        
        if (data.game.solved) {
          setGameState("won");
        } else if (data.game.attempts >= 6) {
          setGameState("lost");
        }
        
        // Get evaluations from server for existing guesses
        if (guessList.length > 0) {
          try {
            const evalResponse = await fetch("/api/game/evaluate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Timezone": getClientTimezone(),
              },
              body: JSON.stringify({ guesses: guessList }),
            });
            
            if (evalResponse.ok) {
              const evalData = await evalResponse.json();
              setEvaluations(evalData.evaluations);
              
              // Update letter states from evaluations
              const fullEvals: LetterEvaluation[][] = guessList.map((guess: string, idx: number) => {
                const evalStates = evalData.evaluations[idx];
                return guess.split("").map((letter, i) => ({
                  letter,
                  state: evalStates[i],
                }));
              });
              updateLetterStates(fullEvals);
            }
          } catch (evalError) {
            console.error("Error loading evaluations:", evalError);
            // Don't show error toast for evaluation errors, just log
          }
        }
      }
    } catch (error) {
      console.error("Error loading game:", error);
      toast.error("Failed to load game. Please try refreshing the page.");
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

    // Basic client-side validation (server will validate too)
    if (!isValidWordSync(currentGuess)) {
      toast.error("Not a valid word");
      return;
    }

    if (!wordId) {
      toast.error("Game not loaded");
      return;
    }

    try {
      const response = await fetch("/api/game/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Timezone": getClientTimezone(),
        },
        body: JSON.stringify({
          guess: currentGuess,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to submit guess");
        return;
      }

      const data = await response.json();
      // Store submitted guess before clearing to prevent flicker
      const submittedGuess = currentGuess;
      
      // Clear currentGuess IMMEDIATELY to prevent it from appearing on next row
      setCurrentGuess("");
      
      const newGuesses = [...guesses, submittedGuess];
      const newEvaluations = [...evaluations, data.evaluation];

      setGuesses(newGuesses);
      setEvaluations(newEvaluations);
      
      // Update letter states from evaluation (use submittedGuess)
      const evaluation: LetterEvaluation[] = submittedGuess.split("").map((letter, i) => ({
        letter,
        state: data.evaluation[i],
      }));
      updateLetterStates([...evaluations.map((evalState, idx) => 
        guesses[idx].split("").map((letter, i) => ({
          letter,
          state: evalState[i],
        }))
      ), evaluation]);

      if (data.solved) {
        setGameState("won");
        toast.success(`Congratulations! You solved it in ${newGuesses.length} tries!`);
        setTimeout(() => {
          router.push("/game/result");
        }, 2000);
      } else if (newGuesses.length >= 6) {
        setGameState("lost");
        toast.error("Better luck next time!");
        setTimeout(() => {
          router.push("/game/result");
        }, 2000);
      }
    } catch (error) {
      toast.error("Failed to submit guess");
    }
  }, [currentGuess, wordId, guesses, evaluations, router]);

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

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect (this should have happened in useEffect, but show message just in case)
  if (status === "unauthenticated") {
    // The useEffect should handle redirect, but show message while it happens
    return null; // Return null to prevent flash of content
  }

  // If authenticated but wordId not loaded yet, show loading
  if (!wordId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Loading game...</div>
          <div className="mt-2 text-sm text-gray-500">Please wait while we set up your game.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
      <div className="flex flex-col items-center max-w-full">
        <h1 className="text-3xl font-bold mb-8 text-wordle-text dark:text-white">Daily Wordle</h1>
        <GameBoard
          guesses={guesses}
          evaluations={evaluations}
          currentGuess={currentGuess}
          gameState={gameState}
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
