import { Router } from "express";
const router = Router();
import { AuthController } from "./auth.controller";
import { wrapAsync } from "../../errors/async-error.wrapper";
router.post("/register", wrapAsync(AuthController.register));
router.post("/login", wrapAsync(AuthController.login));
export default router;