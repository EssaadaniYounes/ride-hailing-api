import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { config } from "../config/env";

const connectionString = `${config.database.url}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

export { prisma }