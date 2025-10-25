#!/bin/bash

# Production Database Sync Script
# This syncs your Prisma schema with production without running migrations

echo "🔄 Syncing production database schema..."

# Generate Prisma client
npx prisma generate

# Push schema to production (this updates schema without migrations)
npx prisma db push --skip-generate --accept-data-loss

echo "✅ Production schema synced successfully!"
echo "You can now build and deploy your application."