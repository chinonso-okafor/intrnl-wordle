# Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Prerequisites
1. A PostgreSQL database (required for production - SQLite won't work on Vercel)
   - Options: [Vercel Postgres](https://vercel.com/storage/postgres), [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app)

### Step 1: Set Up PostgreSQL Database

**Option A: Vercel Postgres (Easiest)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or go to your project
3. Go to Storage → Create Database → Postgres
4. Copy the connection string

**Option B: Neon (Free tier available)**
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard

### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (optional, or use web interface):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Web Interface** (Recommended):
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository: `chinonso-okafor/intrnl-wordle`
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables** in Vercel Dashboard:
   ```
   DATABASE_URL=your_postgres_connection_string
   NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
   NEXTAUTH_URL=https://your-app-name.vercel.app
   ```

4. **Generate NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

### Step 3: Run Database Migrations

After deployment, you need to set up the database:

**Option A: Via Vercel CLI**
```bash
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

**Option B: Via Vercel Build Command**
Add to `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate",
  "vercel-build": "prisma migrate deploy && next build"
}
```

**Option C: Manual Setup**
1. Connect to your PostgreSQL database
2. Run: `npx prisma migrate deploy`
3. Run: `npx prisma db seed`

### Step 4: Update Prisma Schema for Production

Make sure your `prisma/schema.prisma` uses PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 5: Access Your Deployed App

Once deployed, Vercel will provide you with a URL like:
- `https://your-app-name.vercel.app`

Share this URL with your testers!

---

## Alternative: Railway Deployment

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repository
4. Add PostgreSQL service
5. Set environment variables
6. Railway will auto-deploy

---

## Environment Variables Checklist

Make sure these are set in your deployment platform:

- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `NEXTAUTH_SECRET` - Random secret (32+ characters)
- ✅ `NEXTAUTH_URL` - Your production URL

---

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Seed data created (admin user, words)
- [ ] Test login with admin credentials
- [ ] Test game functionality
- [ ] Verify admin panel works
- [ ] Check that word fetching works (if using NYT words feature)

---

## Rollback

If a deploy causes issues, roll back without code changes when possible:

**Vercel:** Dashboard → Project → Deployments → open the previous working deployment → "…" → **Promote to Production**.

**Render:** Dashboard → Your service → Deployments → find the last good deployment → **Rollback**.

**Git (any host):** Revert the bad commit(s) on `main`, then push so the platform redeploys:

```bash
git checkout main
git pull origin main
git revert <commit-hash> --no-edit   # or: git revert HEAD~1 --no-edit
git push origin main
```

No database rollback is needed unless you ran new migrations; this app uses read-only stats and no schema changes in typical feature deploys.

---

## Troubleshooting

**Database Connection Issues:**
- Ensure `DATABASE_URL` is correctly formatted
- Check that your database allows connections from Vercel's IPs
- For Neon/Supabase, you may need to allow all IPs or add Vercel's IPs

**Build Failures:**
- Check that all environment variables are set
- Ensure `prisma generate` runs before build
- Check build logs in Vercel dashboard

**Authentication Issues:**
- Verify `NEXTAUTH_URL` matches your deployment URL exactly
- Ensure `NEXTAUTH_SECRET` is set and consistent
