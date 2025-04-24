// lib/prisma.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handle graceful shutdown of Prisma connection in production
async function disconnect() {
  await prisma.$disconnect();
}

export { prisma, disconnect };
