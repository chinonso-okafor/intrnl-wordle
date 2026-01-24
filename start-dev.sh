#!/bin/bash
# Increase file descriptor limit
ulimit -n 10240
echo "File descriptor limit set to: $(ulimit -n)"
# Start Next.js with turbopack for better performance
npx next dev --turbo
