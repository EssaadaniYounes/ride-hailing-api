import { config } from "../../config/env";
import { BadRequestError, NotFoundError } from "../../errors/domain-errors.base";
import { redis } from "../../factories/redis.factory";
import logger from "../../lib/logger.lib";
import { prisma } from "../../lib/prisma.lib";
import { RideEstimationService } from "./estimation/ride-estimation.service";
import { CreateRideDto } from "./ride.schema";
import { DriverOfferService } from "./matching/driver-offer.service";
import { RideState, RideEventType, UserRole } from "../../generated/prisma/client";
import { RideStateMachine } from "./state-machine";

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

    async accept(rideId: string, userId: string) {
        const driver = await prisma.driver.findUnique({
            where: { userId }
        });

        if (!driver) {
            throw new NotFoundError('Driver profile not found');
        }

        const success = await DriverOfferService.acceptOffer(rideId, driver.id);
        if (!success) {
            throw new BadRequestError('Failed to accept ride: Offer expired or invalid');
        }

        return success;
    },

    async cancel(rideId: string, user: { id: string; role: string }, reason?: string) {
        const ride = await prisma.ride.findUnique({
            where: { id: rideId },
            include: { driver: true }
        });

        if (!ride) {
            throw new NotFoundError('Ride not found');
        }

        const isRider = ride.userId === user.id;
        const isAssignedDriver = ride.driver?.userId === user.id;

        if (!isRider && !isAssignedDriver) {
            throw new BadRequestError('You are not authorized to cancel this ride');
        }

        RideStateMachine.validateTransition(ride.state, RideState.CANCELLED);

        if (ride.state !== RideState.MATCHING && !reason) {
            throw new BadRequestError('Cancellation reason is required after driver assignment');
        }

        await prisma.$transaction(async (tx) => {
            await tx.ride.update({
                where: { id: rideId },
                data: { state: RideState.CANCELLED }
            });

            if (reason) {
                await tx.cancellation.create({
                    data: {
                        rideId,
                        cancelledBy: user.role as UserRole,
                        reason
                    }
                });
            }

            if (ride.driverId) {
                await tx.driver.update({
                    where: { id: ride.driverId },
                    data: { isAvailable: true }
                });
            }

            await tx.rideEvent.create({
                data: {
                    rideId,
                    type: RideEventType.RIDE_CANCELLED,
                    payload: {
                        cancelledBy: user.id,
                        reason
                    } as any
                }
            });
        });

        logger.info(`Ride ${rideId} cancelled by ${user.role} ${user.id}`);
        return true;
    },

    async getHistory(userId: string) {
        return prisma.ride.findMany({
            where: { userId },
            include: {
                driver: true,
                events: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    },

    async getSharedStatus(rideId: string) {
        const ride = await prisma.ride.findUnique({
            where: { id: rideId },
            include: {
                driver: {
                    include: {
                        user: {
                            select: {
                                email: true
                            }
                        }
                    }
                },
                events: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!ride) {
            throw new BadRequestError('Ride not found');
        }

        return {
            id: ride.id,
            state: ride.state,
            pickupLocation: {
                lat: ride.pickupLat,
                lng: ride.pickupLng
            },
            dropoffLocation: {
                lat: ride.dropoffLat,
                lng: ride.dropoffLng
            },
            etaMinutes: ride.etaMinutes,
            distanceKm: ride.distanceKm,
            createdAt: ride.createdAt,
            driver: ride.driver ? {
                name: ride.driver.user.email.split('@')[0],
                currentLocation: {
                    lat: ride.driver.lat,
                    lng: ride.driver.lng
                }
            } : null,
            price: ride.price,
            events: ride.events.map(e => ({
                type: e.type,
                createdAt: e.createdAt,
                meta: e.payload
            }))
        };
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