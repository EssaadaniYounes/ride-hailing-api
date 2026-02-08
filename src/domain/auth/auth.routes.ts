import { Router } from "express";
const router = Router();
import { AuthController } from "./auth.controller";
import { wrapAsync } from "../../errors/async-error.wrapper";
import { validate } from "../../middleware/validate.middleware";
import { RegisterSchema, LoginSchema } from "./auth.schemas";

router.post("/register", validate(RegisterSchema), wrapAsync(AuthController.register));
router.post("/login", validate(LoginSchema), wrapAsync(AuthController.login));

export default router;