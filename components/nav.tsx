"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navItems = [
    { href: "/game", label: "Daily Puzzle" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/stats", label: "Stats" },
    { href: "/how-to-play", label: "How to Play" },
  ];

  if (session?.user?.role === "ADMIN") {
    navItems.push({ href: "/admin", label: "Admin" });
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/game" className="text-2xl font-bold text-wordle-text">
              Wordle
            </Link>
            <div className="ml-10 flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium ${
                    pathname === item.href
                      ? "text-wordle-correct border-b-2 border-wordle-correct"
                      : "text-gray-700 hover:text-wordle-text"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-sm text-gray-700">{session.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-wordle-correct px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
