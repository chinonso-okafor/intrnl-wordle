# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn

## Setup (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Make the setup script executable
chmod +x scripts/setup.sh

# Run the setup script
./scripts/setup.sh
```

This will:
- Create a `.env` file with SQLite database (for local dev)
- Install all dependencies
- Set up the database schema
- Seed initial data (admin user, test user, today's word)

### Option 2: Manual Setup

1. **Create `.env` file:**
```bash
cp .env.example .env
```

2. **Edit `.env` and set:**
```env
# For SQLite (easiest for local dev):
DATABASE_URL="file:./dev.db"

# OR for PostgreSQL:
# DATABASE_URL="postgresql://user:password@localhost:5432/wordle?schema=public"

# Generate secret:
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Install dependencies:**
```bash
npm install
```

4. **Set up database:**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed initial data
npm run db:seed
```

## Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default Login Credentials

**Admin Account:**
- Email: `admin@example.com`
- Password: `admin123`

**Test User Account:**
- Email: `user@example.com`
- Password: `user123`

⚠️ **IMPORTANT:** Change the admin password immediately after first login!

## First Steps

1. **Login** with admin credentials
2. **Go to Admin Panel** → Set words for upcoming days
3. **Play the game** → Try solving today's puzzle
4. **Check Stats** → View your statistics
5. **View Leaderboard** → See team rankings

## Database Management

### View Database (Prisma Studio)
```bash
npm run db:studio
```

### Reset Database
```bash
# Delete the database file (SQLite)
rm prisma/dev.db

# Or drop and recreate (PostgreSQL)
npx prisma migrate reset

# Then push schema and seed again
npx prisma db push
npm run db:seed
```

## Switching to PostgreSQL

1. Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/wordle?schema=public"
```

2. Update `prisma/schema.prisma` datasource:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Push schema:
```bash
npx prisma db push
npm run db:seed
```

## Troubleshooting

### Port 3000 already in use
```bash
# Kill the process or use a different port
PORT=3001 npm run dev
```

### Database connection errors
- Check your `DATABASE_URL` format
- Ensure PostgreSQL is running (if using PostgreSQL)
- Verify database exists and credentials are correct

### Prisma client errors
```bash
npx prisma generate
```

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

## Project Structure

```
/app              - Next.js pages and API routes
/components       - React components
/lib              - Utilities and game logic
/prisma           - Database schema and migrations
/scripts          - Setup and utility scripts
```

## Next Steps

- Add your team members (via Admin panel or Prisma Studio)
- Set words for upcoming days
- Customize the word list in `lib/words.ts`
- Deploy to production (Vercel recommended)

## Support

For issues or questions, check:
- `SETUP.md` - Detailed setup instructions
- `README.md` - Project overview
- Prisma docs: https://www.prisma.io/docs
