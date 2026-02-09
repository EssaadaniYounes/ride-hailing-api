import { UserRole } from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma.lib';
import { hash } from 'bcrypt';
import { redis } from '../src/factories/redis.factory';

async function main() {
    console.log('🌱 Starting seed...');

    // McLean cleanup
    await prisma.rideEvent.deleteMany();
    // await prisma.conversation.deleteMany(); // Assuming this might exist from other relations? If not, ignore
    await prisma.ride.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.user.deleteMany();

    // Flush Redis
    await redis.flushall();
    console.log('🧹 Cleaned DB and Redis');

    const password = await hash('password123', 12);

    // 1. Create User
    const user = await prisma.user.create({
        data: {
            email: 'client@test.com',
            password,
            role: UserRole.USER,
            // hasLocationPermission: true,
        }
    });
    console.log(`👤 Created User: ${user.email} (${user.id})`);

    // 2. Create Drivers
    // Paris coordinates: 48.8566, 2.3522

    // Driver 1: Very close (Notre Dame)
    const driver1User = await prisma.user.create({
        data: {
            email: 'driver1@test.com',
            password,
            role: UserRole.DRIVER,
            // hasLocationPermission: true
        }
    });
    const driver1 = await prisma.driver.create({
        data: {
            userId: driver1User.id,
            lat: 48.8530,
            lng: 2.3499,
            isAvailable: true
        }
    });
    console.log(`🚗 Created Driver 1 (Close): ${driver1User.email} (${driver1User.id})`);

    // Driver 2: Medium distance (Eiffel Tower)
    const driver2User = await prisma.user.create({
        data: {
            email: 'driver2@test.com',
            password,
            role: UserRole.DRIVER,
            // hasLocationPermission: true
        }
    });
    const driver2 = await prisma.driver.create({
        data: {
            userId: driver2User.id,
            lat: 48.8584,
            lng: 2.2945,
            isAvailable: true
        }
    });
    console.log(`🚗 Created Driver 2 (Medium): ${driver2User.email} (${driver2User.id})`);

    // Driver 3: Far (Sacré-Cœur)
    const driver3User = await prisma.user.create({
        data: {
            email: 'driver3@test.com',
            password,
            role: UserRole.DRIVER,
            // hasLocationPermission: true
        }
    });
    const driver3 = await prisma.driver.create({
        data: {
            userId: driver3User.id,
            lat: 48.8867,
            lng: 2.3431,
            isAvailable: true
        }
    });
    console.log(`🚗 Created Driver 3 (Far): ${driver3User.email} (${driver3User.id})`);

    console.log('✅ Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await redis.quit();
    });
