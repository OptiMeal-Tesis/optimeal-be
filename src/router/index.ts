import { Router } from "express";
import { authRouter } from "../domains/auth/controllers/auth.controller.js";
import { userRouter } from "../domains/user/controllers/user.controller.js";
import { healthRouter } from "../domains/health/health.controller.js";
import { productRouter } from "../domains/product/controllers/product.controller.js";
import { sideRouter } from "../domains/sides/controllers/side.controller.js";
import { orderRouter } from "../domains/order/controllers/order.controller.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/health", healthRouter);
router.use("/products", productRouter);
router.use("/sides", sideRouter);
router.use("/orders", orderRouter);

export { router };