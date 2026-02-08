import { config } from "../../config/env";
import { BadRequestError } from "../../errors/domain-errors.base";
import { redis } from "../../factories/redis.factory";
import logger from "../../lib/logger.lib";
import { prisma } from "../../lib/prisma.lib";
import { RideEstimationService } from "./estimation/ride-estimation.service";
import { CreateRideDto } from "./ride.schema";
import { DriverOfferService } from "./matching/driver-offer.service";

export const RideService = {
    async estimate(payload: CreateRideDto, userId: string) {
        if (!payload.locationEnabled) {
            logger.warn(`User ${userId} tried to create a ride without location enabled`);
            throw new BadRequestError(`Please enable location to create a ride`);
        }

        const isAllowed = await RideService.isAllowedToCreateRide(userId);
        if (!isAllowed) {
            logger.warn(`User ${userId} tried to create more than ${config.rides.maxAllowedRequestForUser} rides`);
            throw new BadRequestError(`You have reached the maximum number of rides`);
        }

        const activeRidesCount = await prisma.ride.count({
            where: {
                userId,
                state: {
                    in: ["ONGOING", "MATCHING", "DRIVER_ASSIGNED"]
                }
            }
        });

        if (activeRidesCount) {
            logger.warn(`User ${userId} has active rides`);
            throw new BadRequestError(`You have an active ride, please complete/cancel it before creating a new one`);
        }

        const {
            locationEnabled,
            ...rest
        } = payload;

        const estimatedRide = await RideEstimationService.estimateRide(rest);
        return {
            ...estimatedRide
        }
    },
    async create(payload: CreateRideDto & { distanceKm: number; etaMinutes: number; price: number }, userId: string) {
        try {
            const ride = await prisma.ride.create({
                data: {
                    userId,
                    distanceKm: payload.distanceKm,
                    etaMinutes: payload.etaMinutes,
                    dropoffLat: payload.dropoffLat,
                    dropoffLng: payload.dropoffLng,
                    pickupLat: payload.pickupLat,
                    pickupLng: payload.pickupLng,
                    price: payload.price,
                    state: 'MATCHING',
                }
            });
            await prisma.rideEvent.create({
                data: {
                    rideId: ride.id,
                    type: 'RIDE_REQUESTED',
                    payload: {
                    }
                }
            })
            logger.info(`Created ride ${ride.id} for user ${userId}`);
            await redis.incr(RideService.rideCreationsKeyForUser(userId));
            logger.info(`Updated key ${RideService.rideCreationsKeyForUser(userId)} for user ${userId}`);

            DriverOfferService.startMatching(ride.id).catch((err: unknown) => {
                logger.error(`Error starting matching for ride ${ride.id}:`, err);
            });

            return ride
        } catch (error) {
            logger.error(`Error creating ride for user ${userId}: ${error}`);
            throw error
        }
    },
    rideCreationsKeyForUser(userId: string) {
        return `ride-creations-${userId}`;
    },

    async isAllowedToCreateRide(userId: string) {
        const key = RideService.rideCreationsKeyForUser(userId);
        const amountOfCreations = Number(await redis.get(key)) || 0;

        logger.info(`User ${userId} has ${amountOfCreations} rides created and the limit is ${config.rides.maxAllowedRequestForUser}`);

        if (amountOfCreations >= config.rides.maxAllowedRequestForUser) {
            return false;
        }

        return true;
    }
}