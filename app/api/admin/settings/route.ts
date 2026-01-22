import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAdminAction, AdminActions } from "@/lib/admin-logger";

const DEFAULT_SETTINGS = {
  streakBonus3Day: 2,
  streakBonus7Day: 5,
  streakBonus30Day: 10,
  baseSolvePoints: 10,
  failedAttemptPoints: 5,
  attemptBonus1: 5,
  attemptBonus2: 4,
  attemptBonus3: 3,
  attemptBonus4: 2,
  attemptBonus5: 1,
  attemptBonus6: 1,
  dailyResetTime: "00:00", // UTC time
  timezone: "UTC",
  featureWordReporting: true,
  featureLeaderboard: true,
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.appSettings.findMany();
    const settingsMap: Record<string, any> = { ...DEFAULT_SETTINGS };

    settings.forEach((s) => {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { settings } = await request.json();

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    }

    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      const valueStr = typeof value === "string" ? value : JSON.stringify(value);
      
      await prisma.appSettings.upsert({
        where: { key },
        update: {
          value: valueStr,
          updatedBy: session.user.id as string,
        },
        create: {
          key,
          value: valueStr,
          updatedBy: session.user.id as string,
        },
      });
      
      updates.push(key);
    }

    // Log admin action
    await logAdminAction(session.user.id as string, AdminActions.UPDATE_SETTINGS, {
      updatedKeys: updates,
    });

    // Refresh in-memory Sets if word-related settings changed
    if (updates.some((k) => k.startsWith("attempt") || k.startsWith("streak"))) {
      // Settings that affect point calculation - no need to refresh word Sets
    }

    return NextResponse.json({ success: true, updated: updates });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
