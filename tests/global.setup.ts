import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';

setup('cleanup and seed database', async () => {
  console.log('🔄 Resetting database...');
  try {
    // Reset DB
    execSync('npx prisma db push --force-reset --accept-data-loss', { stdio: 'inherit' });

    // Seed DB
    console.log('🌱 Seeding database...');
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });

    console.log('✅ Database ready for testing');
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
    throw error;
  }
});
