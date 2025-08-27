#!/bin/bash

echo "Waiting for database to be ready..."
sleep 10

echo "Generating Prisma client..."
npx prisma generate

echo "Pushing database schema..."
npx prisma db push

echo "Database initialization complete!"
