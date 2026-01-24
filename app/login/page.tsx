"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
        setIsLoading(false);
      } else if (result?.ok) {
        toast.success("Logged in successfully");
        // Use window.location.href for a hard redirect that ensures session is available
        window.location.href = "/game";
      }
    } catch (error) {
      toast.error("An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-wordle-background dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-wordle-text dark:text-white">
            Sign in
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in to play Wordle
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-base shadow-sm focus:border-wordle-correct focus:outline-none focus:ring-wordle-correct dark:focus:border-wordle-correct dark:focus:ring-wordle-correct"
                style={{ colorScheme: "light dark" }}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-base shadow-sm focus:border-wordle-correct focus:outline-none focus:ring-wordle-correct dark:focus:border-wordle-correct dark:focus:ring-wordle-correct"
                style={{ colorScheme: "light dark" }}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-wordle-correct px-4 py-2 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/register"
              className="text-sm text-wordle-correct hover:underline dark:text-wordle-correct"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
