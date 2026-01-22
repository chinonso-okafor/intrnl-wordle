import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAdminAction, AdminActions } from "@/lib/admin-logger";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const reports = await prisma.wordReport.findMany({
      where: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        word: {
          include: {
            answerWord: {
              select: {
                word: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        word: r.word.answerWord.word,
        wordId: r.wordId,
        reason: r.reason,
        status: r.status,
        user: r.user,
        createdAt: r.createdAt.toISOString(),
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reportId, action } = await request.json();

    if (!reportId || !action) {
      return NextResponse.json({ error: "Missing reportId or action" }, { status: 400 });
    }

    const report = await prisma.wordReport.findUnique({
      where: { id: reportId },
      include: { word: { include: { answerWord: true } } },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.wordReport.update({
        where: { id: reportId },
        data: {
          status: "approved",
          reviewedBy: session.user.id as string,
          reviewedAt: new Date(),
        },
      });

      await logAdminAction(session.user.id as string, AdminActions.APPROVE_REPORT, {
        reportId,
        word: report.word.answerWord.word,
      });
    } else if (action === "reject") {
      await prisma.wordReport.update({
        where: { id: reportId },
        data: {
          status: "rejected",
          reviewedBy: session.user.id as string,
          reviewedAt: new Date(),
        },
      });

      await logAdminAction(session.user.id as string, AdminActions.REJECT_REPORT, {
        reportId,
        word: report.word.answerWord.word,
      });
    } else if (action === "remove") {
      // Remove the word from answer words
      await prisma.answerWord.delete({
        where: { word: report.word.answerWord.word },
      });

      await prisma.wordReport.update({
        where: { id: reportId },
        data: {
          status: "approved",
          reviewedBy: session.user.id as string,
          reviewedAt: new Date(),
        },
      });

      await logAdminAction(session.user.id as string, AdminActions.REMOVE_WORD, {
        reportId,
        word: report.word.answerWord.word,
      });

      // Refresh in-memory Sets
      const { refreshAnswerWordsSet } = await import("@/lib/answer-words");
      refreshAnswerWordsSet();
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
