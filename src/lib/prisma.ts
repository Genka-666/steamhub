import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function getDatabaseUrl(): string {
  // Check if running on Vercel or AWS Lambda serverless runtime
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(/*turbopackIgnore: true*/ tmpDbPath)) {
      const sourceDb = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(/*turbopackIgnore: true*/ sourceDb)) {
        try {
          fs.copyFileSync(sourceDb, tmpDbPath);
        } catch (e) {
          console.error('Failed copying database to /tmp:', e);
        }
      }
    }
    return 'file:/tmp/dev.db';
  }

  return process.env.DATABASE_URL || 'file:./dev.db';
}

const activeDbUrl = getDatabaseUrl();
process.env.DATABASE_URL = activeDbUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
