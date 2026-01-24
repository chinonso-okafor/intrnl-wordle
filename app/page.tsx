import { redirect } from "next/navigation";

export default function Home() {
  redirect("/game");
}

// Prevent layout from rendering during redirect
export const dynamic = "force-dynamic";
