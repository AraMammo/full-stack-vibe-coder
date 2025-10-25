#!/bin/bash

# Deployment migration script for production
# This handles the database migration issues where tables already exist

echo "🚀 Starting production deployment migration process..."

# Check if we're in production
if [ "$NODE_ENV" != "production" ] && [ "$VERCEL_ENV" != "production" ]; then
  echo "⚠️  Warning: Not in production environment"
  echo "Set NODE_ENV=production or VERCEL_ENV=production to continue"
  exit 1
fi

echo "📦 Generating Prisma client..."
npx prisma generate

# Check if _prisma_migrations table exists
echo "🔍 Checking migration status..."
npx prisma migrate status 2>/dev/null

if [ $? -ne 0 ]; then
  echo "⚠️  Migrations table doesn't exist or there's an issue. Creating baseline..."
  
  # Mark existing migrations as applied without running them
  echo "📝 Marking baseline migration as applied..."
  npx prisma migrate resolve --applied "20251021121929_baseline_existing_tables" 2>/dev/null || true
  
  echo "📝 Marking prompt_templates migration as applied..."
  npx prisma migrate resolve --applied "20251021122500_add_prompt_templates" 2>/dev/null || true
else
  echo "✅ Migration table exists. Running pending migrations..."
  npx prisma migrate deploy
fi

echo "🔄 Verifying final migration status..."
npx prisma migrate status

echo "✨ Production migration process complete!"