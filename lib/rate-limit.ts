import { prisma } from "./db";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export async function checkRateLimit(email: string, ipAddress?: string): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
}> {
  const fifteenMinutesAgo = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);

  // Get recent failed attempts
  const recentAttempts = await prisma.loginAttempt.findMany({
    where: {
      email,
      success: false,
      createdAt: { gte: fifteenMinutesAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  // Check if account is locked
  const latestAttempt = recentAttempts[0];
  if (latestAttempt?.lockedUntil && new Date(latestAttempt.lockedUntil) > new Date()) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: new Date(latestAttempt.lockedUntil),
    };
  }

  // Count failed attempts in the last 15 minutes
  const failedCount = recentAttempts.length;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - failedCount);

  if (failedCount >= MAX_ATTEMPTS) {
    // Lock the account
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    
    await prisma.loginAttempt.create({
      data: {
        email,
        ipAddress,
        success: false,
        lockedUntil,
      },
    });

    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil,
    };
  }

  return {
    allowed: true,
    remainingAttempts,
  };
}

export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string
) {
  await prisma.loginAttempt.create({
    data: {
      email,
      ipAddress,
      success,
    },
  });
}
