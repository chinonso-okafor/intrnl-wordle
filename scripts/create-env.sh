#!/bin/bash

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    
    # Generate a random secret
    SECRET=$(openssl rand -base64 32 2>/dev/null || echo "development-secret-change-in-production")
    
    cat > .env << EOF
# Database
# For SQLite (local development - recommended for quick start):
DATABASE_URL="file:./dev.db"

# For PostgreSQL (uncomment and update if using PostgreSQL):
# DATABASE_URL="postgresql://user:password@localhost:5432/wordle?schema=public"

# NextAuth
NEXTAUTH_SECRET="${SECRET}"
NEXTAUTH_URL="http://localhost:3000"
EOF
    
    echo "✅ Created .env file with SQLite database configuration"
    echo "📝 Generated NEXTAUTH_SECRET: ${SECRET}"
    echo ""
    echo "To use PostgreSQL instead, edit .env and update DATABASE_URL"
else
    echo "⚠️  .env file already exists, skipping creation"
fi
