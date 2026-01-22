/**
 * Debug script for faceless video API endpoint
 * Run with: npx tsx scripts/debug-faceless-video.ts
 */

async function main() {
  // Check environment variables
  console.log('=== Environment Variables ===');
  console.log('MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT || '❌ NOT SET (using default: http://localhost:9000)');
  console.log('MINIO_ACCESS_KEY:', process.env.MINIO_ACCESS_KEY || '❌ NOT SET (using default: minioadmin)');
  console.log('MINIO_SECRET_KEY:', process.env.MINIO_SECRET_KEY ? '✅ SET' : '❌ NOT SET (using default: minioadmin123)');
  console.log('MINIO_BUCKET:', process.env.MINIO_BUCKET || '❌ NOT SET (using default: nca-toolkit-local)');
  console.log('N8N_FACELESS_VIDEO_WEBHOOK:', process.env.N8N_FACELESS_VIDEO_WEBHOOK || '❌ NOT SET (using default: http://localhost:5678/webhook/faceless-video)');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ NOT SET (using default: http://localhost:3000)');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET');
  console.log('');

  // Test imports
  console.log('=== Testing Imports ===');
  try {
    const { prisma } = await import('../lib/db');
    console.log('✅ Prisma client imported successfully');

    // Test database connection
    console.log('\n=== Testing Database Connection ===');
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError instanceof Error ? dbError.message : dbError);
    }

    // Check if FacelessVideoJob model exists
    console.log('\n=== Checking Prisma Models ===');
    try {
      // @ts-ignore
      if (prisma.facelessVideoJob) {
        console.log('✅ FacelessVideoJob model exists');

        // Try to count records
        // @ts-ignore
        const count = await prisma.facelessVideoJob.count();
        console.log(`   Found ${count} existing job(s)`);
      } else {
        console.error('❌ FacelessVideoJob model not found in Prisma client');
      }
    } catch (modelError) {
      console.error('❌ Error checking FacelessVideoJob model:', modelError instanceof Error ? modelError.message : modelError);
    }

    // Check if VideoScene model exists
    try {
      // @ts-ignore
      if (prisma.videoScene) {
        console.log('✅ VideoScene model exists');
      } else {
        console.error('❌ VideoScene model not found in Prisma client');
      }
    } catch (modelError) {
      console.error('❌ Error checking VideoScene model:', modelError instanceof Error ? modelError.message : modelError);
    }

  } catch (error) {
    console.error('❌ Failed to import prisma:', error instanceof Error ? error.message : error);
  }

  // Test MinIO client
  console.log('\n=== Testing MinIO Client ===');
  try {
    const { minioClient } = await import('../lib/services/minio-client');
    console.log('✅ MinIO client imported successfully');

    // Try to ensure bucket exists
    try {
      await minioClient.ensureBucket();
      console.log('✅ MinIO bucket ensured');
    } catch (minioError) {
      console.error('❌ MinIO bucket check failed:', minioError instanceof Error ? minioError.message : minioError);
      console.error('   Make sure MinIO is running on', process.env.MINIO_ENDPOINT || 'http://localhost:9000');
    }
  } catch (error) {
    console.error('❌ Failed to import MinIO client:', error instanceof Error ? error.message : error);
  }

  // Test auth
  console.log('\n=== Testing Auth Configuration ===');
  try {
    const { authOptions } = await import('../lib/auth');
    console.log('✅ Auth options imported successfully');
    console.log('   Secret configured:', authOptions.secret ? '✅ YES' : '❌ NO');
    console.log('   Providers:', authOptions.providers?.length || 0);
  } catch (error) {
    console.error('❌ Failed to import auth options:', error instanceof Error ? error.message : error);
  }

  console.log('\n=== Diagnosis Complete ===');
  console.log('Check the errors above to identify the issue.');
  console.log('\nCommon issues:');
  console.log('1. Missing environment variables (MINIO_*, DATABASE_URL)');
  console.log('2. MinIO not running (docker or local instance)');
  console.log('3. Database not migrated (run: npx prisma db push)');
  console.log('4. Prisma client not generated (run: npx prisma generate)');
}

main().catch(console.error);
