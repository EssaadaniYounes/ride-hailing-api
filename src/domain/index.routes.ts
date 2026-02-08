import { Router } from "express";
import authRouter from './auth/auth.routes';
import rideRouter from './ride/ride.routes';
const router = Router();

router.use('/auth', authRouter)
router.use('/rides', rideRouter)
export default router