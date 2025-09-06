import { Router } from "express";
import { authRouter } from "../domains/auth/controllers/auth.controller.js";
import { healthRouter } from "../domains/health/health.controller.js";
import { productRouter } from "../domains/product/controllers/product.controller.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/health", healthRouter);
router.use("/products", productRouter);

export { router };