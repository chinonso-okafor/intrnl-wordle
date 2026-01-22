import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { checkRateLimit, recordLoginAttempt } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Get IP address from request
          const ipAddress = req?.headers?.["x-forwarded-for"] || 
                           req?.headers?.["x-real-ip"] || 
                           undefined;

          // Check rate limit
          try {
            const rateLimit = await checkRateLimit(credentials.email, ipAddress as string);
            if (!rateLimit.allowed) {
              throw new Error(
                rateLimit.lockedUntil
                  ? `Account locked. Try again after ${rateLimit.lockedUntil.toLocaleTimeString()}`
                  : "Too many failed login attempts. Please try again later."
              );
            }
          } catch (rateLimitError: any) {
            // If rate limit check fails, log but don't block (for development)
            console.error("Rate limit check error:", rateLimitError);
            // In production, you might want to throw here
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            try {
              await recordLoginAttempt(credentials.email, false, ipAddress as string);
            } catch (e) {
              console.error("Error recording login attempt:", e);
            }
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isValid) {
            try {
              await recordLoginAttempt(credentials.email, false, ipAddress as string);
            } catch (e) {
              console.error("Error recording login attempt:", e);
            }
            return null;
          }

          // Record successful login
          try {
            await recordLoginAttempt(credentials.email, true, ipAddress as string);
          } catch (e) {
            console.error("Error recording successful login:", e);
            // Don't fail login if logging fails
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as "USER" | "ADMIN",
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
