import { redis } from '../../../factories/redis.factory';
import logger from '../../../lib/logger.lib';
import { prisma } from '../../../lib/prisma.lib';
import { RideState, RideEventType } from '../../../generated/prisma/client';
import { DriverMatchingService } from './driver-matching.service';
import { RideStateMachine } from '../state-machine';

const OFFER_TTL_SECONDS = 15;

export const DriverOfferService = {
    async initialize() {
        try {
            await redis.config('SET', 'notify-keyspace-events', 'Ex');

            const subscriber = redis.duplicate();
            await subscriber.subscribe('__keyevent@0__:expired');

            subscriber.on('message', async (channel, message) => {
                if (message.startsWith('ride:') && message.includes(':offer:')) {
                    const parts = message.split(':');
                    const rideId = parts[1];
                    const driverId = parts[3];

                    logger.info(`Offer expired for ride ${rideId} and driver ${driverId}`);
                    await this.handleOfferExpired(rideId, driverId);
                }
            });

            logger.info('Driver matching service initialized with Redis Keyspace Notifications');
        } catch (error) {
            logger.error('Failed to initialize driver matching service', error);
        }
    },

    getOfferKey(rideId: string, driverId: string) {
        return `ride:${rideId}:offer:${driverId}`;
    },

    getTriedDriversKey(rideId: string) {
        return `ride:${rideId}:drivers_tried`;
    },

    async startMatching(rideId: string) {
        await this.tryNextDriver(rideId);
    },

    async tryNextDriver(rideId: string) {
        const ride = await prisma.ride.findUnique({
            where: { id: rideId }
        });

        if (!ride || ride.state !== RideState.MATCHING) {
            logger.warn(`Ride ${rideId} not found or not in MATCHING state. Stopping matching.`);
            return;
        }

        const triedDrivers = await redis.smembers(this.getTriedDriversKey(rideId));

        const drivers = await DriverMatchingService.findNearestDrivers(
            ride.pickupLat,
            ride.pickupLng,
            10 
        );

        const nextDriver = drivers.find(d => !triedDrivers.includes(d.id));

        if (!nextDriver) {
            logger.warn(`No more available drivers for ride ${rideId}`);
            return;
        }

        await this.createOffer(rideId, nextDriver.id);
    },

    async createOffer(rideId: string, driverId: string) {
        const key = this.getOfferKey(rideId, driverId);

        await redis.set(key, 'pending', 'EX', OFFER_TTL_SECONDS);

        await redis.sadd(this.getTriedDriversKey(rideId), driverId);

        await prisma.rideEvent.create({
            data: {
                rideId,
                type: RideEventType.DRIVER_OFFERED,
                payload: { driverId, ttl: OFFER_TTL_SECONDS } as any
            }
        });

        logger.info(`Offer created for ride ${rideId} to driver ${driverId}`);
    },

    async handleOfferExpired(rideId: string, driverId: string) {
        logger.info(`Offer expired for driver ${driverId} on ride ${rideId}. Trying next driver...`);
        await this.tryNextDriver(rideId);
    },

    async acceptOffer(rideId: string, driverId: string) {
        const key = this.getOfferKey(rideId, driverId);
        const result = await redis.del(key); 

        if (result === 0) {
            logger.warn(`Driver ${driverId} tried to accept expired/non-existent offer for ride ${rideId}`);
            return false;
        }

        await prisma.$transaction(async (tx) => {
            const ride = await tx.ride.findUnique({ where: { id: rideId } });
            if (!ride) throw new Error('Ride not found');

            RideStateMachine.validateTransition(ride.state, RideState.DRIVER_ASSIGNED);

            await tx.ride.update({
                where: { id: rideId },
                data: {
                    state: RideState.DRIVER_ASSIGNED,
                    driverId: driverId
                }
            });

            await tx.driver.update({
                where: { id: driverId },
                data: { isAvailable: false }
            });

            await tx.rideEvent.create({
                data: {
                    rideId,
                    type: RideEventType.DRIVER_ASSIGNED,
                    payload: { driverId } as any
                }
            });
        });

        logger.info(`Driver ${driverId} accepted ride ${rideId}`);
        return true;
    },

    async rejectOffer(rideId: string, driverId: string) {
        const key = this.getOfferKey(rideId, driverId);
        await redis.del(key); 

        logger.info(`Driver ${driverId} rejected ride ${rideId}`);
        await this.tryNextDriver(rideId);
        return true;
    }
};
