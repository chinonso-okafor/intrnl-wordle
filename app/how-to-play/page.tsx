"use client";

import { Tile } from "@/components/how-to-play-tile";

export default function HowToPlayPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-wordle-text dark:text-white">How to Play</h1>

        <div className="space-y-8">
          <section className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">The Basics</h2>
            <p className="text-gray-700 mb-4">
              Wordle is a word guessing game. You have 6 attempts to guess a 5-letter word.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Each guess must be a valid 5-letter word</li>
              <li>After each guess, the tiles change color to show how close your guess was</li>
              <li>The same word is used for all players each day</li>
              <li>A new word is available every day at midnight</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">Tile Colors</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">🟩 Green - Correct Letter, Correct Position</h3>
                <p className="text-gray-700 mb-3">
                  The letter is in the word and in the correct position.
                </p>
                <div className="flex gap-2 mb-4">
                  <Tile letter="W" state="correct" />
                  <Tile letter="O" />
                  <Tile letter="R" />
                  <Tile letter="D" />
                  <Tile letter="S" />
                </div>
                <p className="text-sm text-gray-600">
                  In this example, "W" is in the word and in the first position.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">🟨 Yellow - Correct Letter, Wrong Position</h3>
                <p className="text-gray-700 mb-3">
                  The letter is in the word but in a different position.
                </p>
                <div className="flex gap-2 mb-4">
                  <Tile letter="S" />
                  <Tile letter="T" />
                  <Tile letter="O" state="present" />
                  <Tile letter="R" />
                  <Tile letter="E" />
                </div>
                <p className="text-sm text-gray-600">
                  In this example, "O" is in the word but not in the third position.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">⬛ Gray - Letter Not in Word</h3>
                <p className="text-gray-700 mb-3">
                  The letter is not in the word at all.
                </p>
                <div className="flex gap-2 mb-4">
                  <Tile letter="A" />
                  <Tile letter="P" />
                  <Tile letter="P" />
                  <Tile letter="L" state="absent" />
                  <Tile letter="E" />
                </div>
                <p className="text-sm text-gray-600">
                  In this example, "L" is not in the word.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">Scoring System</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Base Points</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>Solved puzzle:</strong> 10 base points</li>
                  <li><strong>Failed attempt:</strong> 5 points (encourages participation)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Attempt Bonus</h3>
                <p className="text-gray-700 mb-2">Additional points based on how quickly you solve:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Guess 1: +5 points (total: 15)</li>
                  <li>Guess 2: +4 points (total: 14)</li>
                  <li>Guess 3: +3 points (total: 13)</li>
                  <li>Guess 4: +2 points (total: 12)</li>
                  <li>Guess 5: +1 point (total: 11)</li>
                  <li>Guess 6: +1 point (total: 11)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Streak Bonuses</h3>
                <p className="text-gray-700 mb-2">Bonus points for maintaining streaks (cumulative):</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>3-day streak: +2 points per game</li>
                  <li>7-day streak: +5 points per game</li>
                  <li>30-day streak: +10 points per game</li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  Example: With a 7-day streak and solving in 2 guesses, you earn 14 + 5 = 19 points!
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">Example Game</h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Guess 1: "STORM"</p>
                <div className="flex gap-2 mb-2">
                  <Tile letter="S" state="absent" />
                  <Tile letter="T" state="present" />
                  <Tile letter="O" state="absent" />
                  <Tile letter="R" state="absent" />
                  <Tile letter="M" state="absent" />
                </div>
                <p className="text-sm text-gray-600">
                  "T" is in the word but in a different position. "S", "O", "R", "M" are not in the word.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Guess 2: "LIGHT"</p>
                <div className="flex gap-2 mb-2">
                  <Tile letter="L" state="absent" />
                  <Tile letter="I" state="absent" />
                  <Tile letter="G" state="absent" />
                  <Tile letter="H" state="present" />
                  <Tile letter="T" state="correct" />
                </div>
                <p className="text-sm text-gray-600">
                  "T" is in the correct position (last)! "H" is in the word but in a different position. "L", "I", "G" are not in the word.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Guess 3: "HEART"</p>
                <div className="flex gap-2 mb-2">
                  <Tile letter="H" state="present" />
                  <Tile letter="E" state="present" />
                  <Tile letter="A" state="present" />
                  <Tile letter="R" state="absent" />
                  <Tile letter="T" state="correct" />
                </div>
                <p className="text-sm text-gray-600">
                  "H", "E", and "A" are in the word but in wrong positions. "T" is still correct. "R" is not in the word.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Guess 4: "WHEAT"</p>
                <div className="flex gap-2 mb-2">
                  <Tile letter="W" state="correct" />
                  <Tile letter="H" state="correct" />
                  <Tile letter="E" state="correct" />
                  <Tile letter="A" state="correct" />
                  <Tile letter="T" state="correct" />
                </div>
                <p className="text-sm text-gray-600 font-semibold text-wordle-correct">
                  Solved! The word was "WHEAT". All letters are in the correct position. You earned points based on solving in 4 guesses plus any streak bonuses.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Start with words that have common vowels (A, E, I, O, U)</li>
              <li>Use your second guess to test different letters</li>
              <li>Pay attention to letter positions - green means correct position!</li>
              <li>Remember that letters can appear multiple times in a word</li>
              <li>Play daily to maintain your streak and earn bonus points</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
