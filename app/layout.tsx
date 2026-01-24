import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Optimizer+ Wordle",
  description: "Internal Wordle game for your team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body className={`${inter.className} overflow-x-hidden`}>
        <Providers>
          <Nav />
          <main className="min-h-screen bg-wordle-background dark:bg-gray-900">{children}</main>
          <Toaster 
            position="top-center"
            toastOptions={{
              className: "dark:bg-gray-800 dark:text-white",
              duration: 4000,
              success: {
                duration: 3000,
              },
              error: {
                duration: 5000,
              },
            }}
            containerStyle={{
              top: 80,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
