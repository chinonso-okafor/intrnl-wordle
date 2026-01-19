#!/bin/bash

echo "🚀 Setting up Optimizer Wordle..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database
# For PostgreSQL (uncomment and update):
# DATABASE_URL="postgresql://user:password@localhost:5432/wordle?schema=public"

# For SQLite (local development):
DATABASE_URL="file:./dev.db"

# NextAuth
# Generated secret (change in production!)
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
EOF
    echo "✅ Created .env file"
else
    echo "⚠️  .env file already exists, skipping..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup database
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review .env file and update DATABASE_URL if using PostgreSQL"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000"
echo "4. Login with admin@example.com / admin123"
echo ""
echo "⚠️  IMPORTANT: Change the admin password after first login!"
