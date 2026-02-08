import { Response } from "express";
import { RideService } from "./ride.service";
import logger from "../../lib/logger.lib";
import { AuthRequest } from "../../middleware/authenticate.middleware";
export const RideController = {
    async create(req: AuthRequest, res: Response) {
        const body = req.body;
        logger.info(`Creating new ride for user ${req.user?.id}`);
        const estimations = await RideService.estimate(body, req.user?.id!);
        const ride = await RideService.create({ ...estimations, ...body }, req.user?.id!);
        return res.status(201).json({
            message: 'Ride created successfully',
            data: {
                id: ride.id,
                status: ride.state
            }
        })
    }
}