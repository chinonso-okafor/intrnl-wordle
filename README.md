# Optimizer Wordle

A full-stack internal Wordle game for teams with leaderboards, scoring, and admin features.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (SQLite for local development)
- **Authentication**: NextAuth.js v4
- **UI Components**: Shadcn UI
- **Animations**: Framer Motion
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL (or use SQLite for local dev)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)

3. Set up the database:
```bash
npx prisma db push
npx prisma db seed
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Admin Setup

After seeding the database, you can log in with:
- Email: `admin@example.com`
- Password: `admin123`

**Important**: Change the admin password immediately after first login!

## Features

- Daily Wordle puzzles
- Scoring system with streak bonuses
- Personal stats dashboard
- Multiple leaderboards (weekly, monthly, quarterly, yearly, all-time)
- Share results with emoji grid
- Admin panel for word management
- User management

## Project Structure

```
/app              - Next.js App Router pages
/components       - React components
/lib              - Utilities and helpers
/prisma           - Database schema and migrations
/public           - Static assets
```
