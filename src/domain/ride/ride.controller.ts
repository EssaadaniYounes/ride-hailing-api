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
    },

    async accept(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const userId = req.user?.id!;

        await RideService.accept(id as string, userId);

        return res.status(200).json({
            message: 'Ride accepted successfully',
            data: null,
        });
    },

    async cancel(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const { reason } = req.body;
        const user = req.user!;

        await RideService.cancel(id as string, { id: user.id, role: user.role as string }, reason);

        return res.status(200).json({
            message: 'Ride cancelled successfully',
            data: null,
        });
    },

    async getHistory(req: AuthRequest, res: Response) {
        const userId = req.user?.id!;
        const history = await RideService.getHistory(userId);
        return res.status(200).json({
            data: history
        });
    },
    async status(req: AuthRequest, res: Response) {
        const rideId = req.params.id;
        //We can here have a separate feature for DRIVER/USER To generate a sharable link.
        const rideStatus = await RideService.getSharedStatus(rideId as string);
        return res.status(200).json({
            data: rideStatus
        });
    }
}