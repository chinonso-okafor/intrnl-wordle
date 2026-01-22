import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchNYTWords } from "@/lib/word-fetcher";
import { logAdminAction, AdminActions } from "@/lib/admin-logger";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const nytWords = await fetchNYTWords();

    if (nytWords.length === 0) {
      return NextResponse.json({ 
        error: "No words fetched. The website may have changed or is unavailable." 
      }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (const word of nytWords) {
      try {
        await prisma.answerWord.upsert({
          where: { word },
          update: { source: "nyt" },
          create: {
            word,
            source: "nyt",
          },
        });
        imported++;
      } catch (error: any) {
        if (error.code === "P2002") {
          skipped++;
        } else {
          console.error(`Error importing word ${word}:`, error);
          skipped++;
        }
      }
    }

    // Log admin action
    await logAdminAction(session.user.id as string, AdminActions.FETCH_NYT_WORDS, {
      fetched: nytWords.length,
      imported,
      skipped,
    });

    // Refresh in-memory Sets
    const { refreshAnswerWordsSet } = await import("@/lib/answer-words");
    refreshAnswerWordsSet();

    return NextResponse.json({
      success: true,
      fetched: nytWords.length,
      imported,
      skipped,
    });
  } catch (error) {
    console.error("Error fetching NYT words:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
