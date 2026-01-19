# Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or use SQLite for local development)
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/wordle?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

**For SQLite (local development only):**
```env
DATABASE_URL="file:./dev.db"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Set Up Database

```bash
# Push the schema to your database
npx prisma db push

# Seed the database with initial data
npm run db:seed
```

This will create:
- An admin user: `admin@example.com` / `admin123`
- A test user: `user@example.com` / `user123`
- Today's word (randomly selected)

**⚠️ IMPORTANT:** Change the admin password immediately after first login!

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Admin Setup

1. Log in with the admin credentials from the seed data
2. Go to the Admin panel
3. Set words for upcoming days using the calendar picker
4. Manage users and view statistics

## Adding Team Members

Currently, team members need to be added manually:

1. Admin can view all users in the Admin panel
2. For production, you may want to add a registration/invitation system
3. Users can be created via Prisma Studio: `npm run db:studio`

## Production Deployment

### Environment Variables

Make sure to set these in your production environment:
- `DATABASE_URL` - Your production PostgreSQL connection string
- `NEXTAUTH_SECRET` - A secure random secret
- `NEXTAUTH_URL` - Your production URL (e.g., `https://wordle.yourcompany.com`)

### Database Migrations

For production, use Prisma migrations:

```bash
npx prisma migrate deploy
```

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

## Daily Word Management

The admin can set words for any date:
1. Go to Admin → Word Management
2. Enter a 5-letter word
3. Select the date
4. Click "Set Word"

If no word is set for a day, a random word from the dictionary will be used (fallback).

## Troubleshooting

### Database Connection Issues

- Check your `DATABASE_URL` format
- Ensure PostgreSQL is running
- Verify database credentials

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies if needed

### Word Validation

- Words must be exactly 5 letters
- Words must be in the `VALID_WORDS` list in `lib/words.ts`
- Admin can add more words to this list

## Project Structure

```
/app              - Next.js App Router pages
  /api            - API routes
  /admin          - Admin panel
  /game           - Game pages
  /leaderboard    - Leaderboard pages
  /stats          - Stats page
/components       - React components
/lib              - Utilities and helpers
/prisma           - Database schema
/public           - Static assets
/types            - TypeScript type definitions
```

## Features Implemented

✅ Daily Wordle gameplay
✅ Scoring system with streak bonuses
✅ Personal stats dashboard
✅ Multiple leaderboards (weekly, monthly, quarterly, yearly, all-time)
✅ Share results with emoji grid
✅ Admin panel for word management
✅ User authentication
✅ Responsive design

## Next Steps (Optional Enhancements)

- User registration/invitation system
- Email notifications for daily puzzles
- Export leaderboard data (CSV)
- More detailed admin statistics
- User avatars/profile pictures
- Dark mode
- Mobile app (React Native)
