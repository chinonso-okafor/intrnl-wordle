"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useDarkMode } from "@/lib/dark-mode-context";

export function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
    <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <Link 
              href="/game" 
              className="text-lg sm:text-xl md:text-2xl font-bold text-wordle-text dark:text-white truncate pr-2 sm:pr-4"
            >
              Optimizer+ Wordle
            </Link>
            <nav className="hidden md:flex md:ml-6 lg:ml-10 md:space-x-2 lg:space-x-4 flex-shrink-0">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium whitespace-nowrap transition-colors ${
                    pathname === item.href
                      ? "text-wordle-correct border-b-2 border-wordle-correct dark:text-wordle-correct"
                      : "text-gray-700 dark:text-gray-300 hover:text-wordle-text dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
            <button
              onClick={toggleDarkMode}
              className="rounded-md p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-md p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4">
              {session ? (
                <>
                  <span className="text-xs lg:text-sm text-gray-700 dark:text-gray-300 truncate max-w-[100px] lg:max-w-none">
                    {session.user?.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="rounded-md bg-gray-100 dark:bg-gray-700 px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-md bg-wordle-correct px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium text-white hover:bg-opacity-90 transition-colors whitespace-nowrap"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4 animate-in slide-in-from-top-2">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium transition-colors ${
                    pathname === item.href
                      ? "text-wordle-correct border-l-4 border-wordle-correct dark:text-wordle-correct bg-gray-50 dark:bg-gray-700/50"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {session ? (
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">{session.user?.name}</div>
                  <button
                    onClick={() => signOut()}
                    className="w-full rounded-md bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md bg-wordle-correct px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 text-center transition-colors mt-2"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
