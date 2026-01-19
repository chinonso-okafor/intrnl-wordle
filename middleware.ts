import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/game/:path*", "/stats", "/leaderboard", "/admin/:path*"],
};
