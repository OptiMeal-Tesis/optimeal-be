#!/bin/bash

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Push database schema
echo "Pushing database schema..."
npx prisma db push

# Start the application based on NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
    echo "Starting in production mode..."
    exec node --enable-source-maps dist/index.js
else
    echo "Starting in development mode..."
    exec npm run dev
fi
