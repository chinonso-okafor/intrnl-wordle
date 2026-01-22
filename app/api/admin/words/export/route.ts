import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "answer"; // "answer" or "validation"

    if (type === "answer") {
      const words = await prisma.answerWord.findMany({
        orderBy: { word: "asc" },
      });

      // Generate CSV
      const csvHeader = "word,source\n";
      const csvRows = words.map((w) => `"${w.word}","${w.source}"`).join("\n");
      const csv = csvHeader + csvRows;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="answer-words-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else {
      const words = await prisma.validationWord.findMany({
        orderBy: { word: "asc" },
      });

      // Generate CSV
      const csvHeader = "word\n";
      const csvRows = words.map((w) => `"${w.word}"`).join("\n");
      const csv = csvHeader + csvRows;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="validation-words-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting words:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
