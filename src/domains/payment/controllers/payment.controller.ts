import { Router, Request, Response } from "express";
import HttpStatus from "http-status";
import { authenticateToken } from "../../../middleware/authentication.js";
import { requireAuth } from "../../../middleware/authorization.js";
import { BodyValidation, ParamsValidation } from "../../../middleware/validation.js";
import { CheckoutDTO, CheckoutIdParamDTO } from "../dto/payment.dto.js";
import { PaymentService } from "../services/payment.service.js";

export const paymentRouter = Router();

const service: PaymentService = new PaymentService();

// POST /api/payments/checkout
paymentRouter.post(
  "/checkout",
  authenticateToken,
  requireAuth,
  BodyValidation(CheckoutDTO),
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    try {
      const result = await service.createCheckout({
        userId,
        items: req.body.items,
        shift: req.body.shift,
      });
      if (!result.success) {
        return res.status(HttpStatus.BAD_REQUEST).json(result);
      }
      return res.status(HttpStatus.OK).json(result);
    } catch (err: any) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message || "Internal error" });
    }
  }
);

// GET /api/payments/checkout/:id/status
paymentRouter.get(
  "/checkout/:id/status",
  authenticateToken,
  requireAuth,
  ParamsValidation(CheckoutIdParamDTO),
  async (req: Request, res: Response) => {
    const id = (req as any).params.id as number;
    try {
      const result = await service.getCheckoutStatus(id);
      const statusCode = result.success ? HttpStatus.OK : HttpStatus.NOT_FOUND;
      return res.status(statusCode).json(result);
    } catch (err: any) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message || "Internal error" });
    }
  }
);

// Webhook para Mercado Pago
paymentRouter.post(
  "/webhooks/mercadopago",
  async (req: Request, res: Response) => {
    try {
      await service.handleMercadoPagoWebhook(req.body);
      return res.status(HttpStatus.OK).send("ok");
    } catch (err: any) {
      // Always return 200 to avoid MP retries on non-critical errors, unless signature validation is added
      return res.status(HttpStatus.OK).send("ok");
    }
  }
);

export { };



