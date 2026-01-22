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
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const activities = await prisma.adminActivityLog.findMany({
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.adminActivityLog.count();

    return NextResponse.json({
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        details: JSON.parse(a.details || "{}"),
        admin: a.admin,
        createdAt: a.createdAt.toISOString(),
      })),
      total,
    });
  } catch (error) {
    console.error("Error fetching admin activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
