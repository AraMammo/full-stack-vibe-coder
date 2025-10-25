# Production Database Migration Fix

## Problem
The production deployment is failing because:
1. Production database already has the `prompt_templates` table created
2. Prisma migrations are trying to CREATE the table again 
3. There's a mismatch between development and production database schemas
4. The project uses BOTH Prisma and Drizzle ORMs, causing confusion

## Root Cause
- Some tables were created in production outside of Prisma's migration system
- Prisma doesn't know these migrations were already "applied" in production
- The migration system is trying to recreate tables that already exist

## Solution

### Immediate Fix (For Current Deployment)

1. **Option A: Mark Migrations as Applied (Recommended)**
   
   In your deployment pipeline or production environment, run:
   ```bash
   # Mark the migrations as already applied without running them
   npx prisma migrate resolve --applied "20251021121929_baseline_existing_tables"
   npx prisma migrate resolve --applied "20251021122500_add_prompt_templates"
   ```

2. **Option B: Use the Deployment Script**
   
   Run the deployment migration script:
   ```bash
   NODE_ENV=production ./scripts/deploy-migrations.sh
   ```

3. **Option C: Skip Migrations in Deployment**
   
   Instead of running `prisma migrate deploy`, use:
   ```bash
   # This syncs schema without using migration history
   npx prisma db push --skip-generate --accept-data-loss
   ```

### Long-term Solution

1. **Consolidate to One ORM**
   - Choose either Prisma OR Drizzle (not both)
   - Migrate all database operations to the chosen ORM
   - Remove the unused ORM configuration

2. **Proper Migration Management**
   - Always create migrations in development first
   - Test migrations before deploying to production
   - Use `prisma migrate dev` for development
   - Use `prisma migrate deploy` for production

3. **Deployment Process**
   ```bash
   # In your deployment configuration (Vercel, etc.), use:
   npm run build  # This now includes 'prisma generate'
   npx prisma migrate deploy  # Only after migrations are properly synced
   ```

## Verification

After fixing, verify the deployment works:

1. Check migration status:
   ```bash
   npx prisma migrate status
   ```

2. Verify tables exist:
   ```bash
   npx prisma db pull  # This will show you what's actually in the database
   ```

3. Test the deployment:
   - Click "Cancel deployment" in the current failed deployment
   - Apply one of the fixes above
   - Retry the deployment

## Prevention

To prevent this in the future:
1. Always use migrations for schema changes
2. Test deployments in a staging environment first
3. Keep development and production schemas in sync
4. Use a single ORM consistently throughout the project