import { Router } from "express";
const router = Router();
import { wrapAsync } from "../../errors/async-error.wrapper";
import { validate } from "../../middleware/validate.middleware";
import { CreateRideSchema } from "./ride.schema";
import { RideController } from "./ride.controller";
import { authenticate } from "../../middleware/authenticate.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { Role } from "../../config/role.enum";

router.post("/create", authenticate, authorize(Role.USER), validate(CreateRideSchema), wrapAsync(RideController.create));
router.patch("/:id/accept", authenticate, authorize(Role.DRIVER), wrapAsync(RideController.accept));
router.patch("/:id/cancel", authenticate, authorize(Role.USER, Role.DRIVER), wrapAsync(RideController.cancel));
router.patch("/:id/status", wrapAsync(RideController.status));
router.get("/history", authenticate, authorize(Role.USER, Role.DRIVER), wrapAsync(RideController.getHistory));

export default router;