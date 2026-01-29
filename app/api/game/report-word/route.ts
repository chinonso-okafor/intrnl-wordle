import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDateForTimezone, getTimezoneFromRequest } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reason } = await request.json();

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    const timezone = getTimezoneFromRequest(request);
    const todayStr = getTodayDateForTimezone(timezone);
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0);

    // Get today's word
    const word = await prisma.word.findUnique({
      where: { dateUsed: today },
    });

    if (!word) {
      return NextResponse.json({ error: "No word found for today" }, { status: 404 });
    }

    // Check if user already reported this word
    const existingReport = await prisma.wordReport.findFirst({
      where: {
        userId: session.user.id as string,
        wordId: word.id,
        status: "pending",
      },
    });

    if (existingReport) {
      return NextResponse.json({ error: "You have already reported this word" }, { status: 400 });
    }

    // Create report
    const report = await prisma.wordReport.create({
      data: {
        userId: session.user.id as string,
        wordId: word.id,
        reason: reason.trim(),
        status: "pending",
      },
    });

    return NextResponse.json({ 
      success: true,
      report: {
        id: report.id,
        status: report.status,
      },
    });
  } catch (error) {
    console.error("Error reporting word:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
