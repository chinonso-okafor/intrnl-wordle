#!/bin/bash
set -e

echo "Starting application initialization..."

# Run database initialization
echo "Initializing database..."
node scripts/init-db.js

# Start the Next.js server
echo "Starting Next.js server..."
exec npm start
