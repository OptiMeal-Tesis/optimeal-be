import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "../../../lib/prisma.js";
import { CheckoutRequest, CheckoutRequestWithPickUpTime } from "../dto/payment.dto.js";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { OrderService } from "../../order/services/order.service.js";
import { broadcastNewOrder, broadcastShiftSummaryUpdate } from "../../../lib/supabase-realtime.js";
import { shiftsConfig } from "../../../config/shifts.config.js";

export class PaymentService {
  private client: MercadoPagoConfig;
  private preference: Preference;

  constructor() {
    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error("Missing MP_ACCESS_TOKEN env var");
    }
    this.client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    this.preference = new Preference(this.client);
  }

  async createCheckout(request: CheckoutRequest): Promise<{ success: boolean; message: string; data?: { checkoutId: number; initPoint: string; preferenceId: string } }> {
    // Convert shift to pickUpTime
    const pickUpTime = shiftsConfig.shiftToPickUpTime(request.shift);
    
    if (!pickUpTime) {
      return { success: false, message: `Invalid shift: ${request.shift}` };
    }

    // Create request with pickUpTime instead of shift
    const requestWithPickUpTime: CheckoutRequestWithPickUpTime = {
      ...request,
      pickUpTime,
    };

    // Reuse validations from OrderService
    const orderService = new OrderService();

    // This line is commented becase we want to create orders whenever we want to test.
    // orderService["validateCreateOrderRequest"](requestWithPickUpTime as any);
    
    await orderService["validateProductsExist"](requestWithPickUpTime.items as any);
    await orderService["validateSidesExist"](requestWithPickUpTime.items as any);
    await orderService["validateProductSideCompatibility"](requestWithPickUpTime.items as any);

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Calculate total price same as order repo
        let total = 0;
        for (const item of requestWithPickUpTime.items) {
          const product = await tx.product.findFirst({
            where: { id: item.productId, deletedAt: null },
          });
          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product ${product.name}`);
          }
          total += product.price * item.quantity;
        }

        // Reserve stock atomically by decrementing now
        for (const item of requestWithPickUpTime.items) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(`Insufficient stock while reserving product ${item.productId}`);
          }
        }

        // Create a Checkout record first (status PENDING)
        const externalReference = randomUUID();
        const checkout = await tx.checkout.create({
          data: {
            userId: requestWithPickUpTime.userId,
            status: "PENDING",
            totalPrice: total,
            pickUpTime: new Date(requestWithPickUpTime.pickUpTime),
            externalReference,
            items: {
              create: requestWithPickUpTime.items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: 0,
                notes: i.notes,
                sideId: i.sideId ?? null,
              })),
            },
          },
        });

        // Build MP preference
        const preference: any = {
          external_reference: checkout.externalReference,
          title: "OptiMeal",
          picture_url: process.env.MP_LOGO_URL,
          items: await Promise.all(
            requestWithPickUpTime.items.map(async (i) => {
              const product = await tx.product.findUnique({ where: { id: i.productId } });
              return {
                id: String(i.productId),
                title: product?.name ?? `Product ${i.productId}`,
                quantity: i.quantity,
                currency_id: "ARS",
                unit_price: product?.price ?? 0,
              } as any;
            })
          ),
        };

        preference.auto_return = process.env.MP_AUTO_RETURN === "false" ? undefined : "approved";
        preference.back_urls = {
          success: process.env.MP_BACK_URL_SUCCESS,
          failure: process.env.MP_BACK_URL_FAILURE,
          pending: process.env.MP_BACK_URL_PENDING,
        };
        preference.notification_url = process.env.MP_WEBHOOK_URL;

        let prefResponse;
        try {
          prefResponse = await this.preference.create({ body: preference });
        } catch (e) {
          // If MP fails, release reserved stock and rethrow
          for (const item of requestWithPickUpTime.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
          throw e;
        }

        // Save preference id and init point
        const updated = await tx.checkout.update({
          where: { id: checkout.id },
          data: {
            preferenceId: prefResponse.id,
            initPoint: prefResponse.init_point,
          },
        });

        return {
          checkoutId: updated.id,
          initPoint: updated.initPoint!,
          preferenceId: updated.preferenceId!,
        };
      });

      return {
        success: true,
        message: "Checkout created",
        data: result,
      };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to create checkout" };
    }
  }

  async getCheckoutStatus(id: number): Promise<{ success: boolean; message: string; data?: { status: string } }> {
    const checkout = await prisma.checkout.findUnique({ where: { id } });
    if (!checkout) {
      return { success: false, message: "Checkout not found" };
    }
    return { success: true, message: "Checkout status", data: { status: checkout.status } };
  }

  async handleMercadoPagoWebhook(body: any): Promise<void> {
    const bodyData = body || {};
    const type = bodyData.type || bodyData.topic;

    const paymentId: string | number | undefined = bodyData?.data?.id || bodyData?.data?.payment?.id || bodyData?.id;
    if (!type || !paymentId) return;

    // Fetch payment info
    const { Payment } = await import("mercadopago");
    const payment = new Payment(this.client);
    const paymentData = await payment.get({ id: paymentId });
    const status = paymentData.status as string;
    const externalReference = paymentData.external_reference as string;

    const checkout = await prisma.checkout.findFirst({ where: { externalReference }, include: { items: true } });
    if (!checkout) return;

    // Idempotency: if checkout already processed, ignore duplicate webhooks
    if (checkout.status === "APPROVED") {
      return;
    }

    if (status === "approved") {
      // Create order and finalize
      let orderId: number | null = null;
      
      await prisma.$transaction(async (tx) => {
        orderId = await this.createOrderFromCheckout(tx, checkout.id);
        await tx.checkout.update({ where: { id: checkout.id }, data: { status: "APPROVED" } });
      });

      // Broadcast AFTER transaction completes (synchronously)
      if (orderId) {
        await this.broadcastOrderCreation(orderId);
      }
    } else if (["rejected", "cancelled", "expired"].includes(status)) {
      await prisma.$transaction(async (tx) => {
        // Release reserved stock
        for (const item of checkout.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.checkout.update({ where: { id: checkout.id }, data: { status: status.toUpperCase() as any } });
      });
    }
  }

  private async createOrderFromCheckout(tx: Prisma.TransactionClient, checkoutId: number): Promise<number> {
    const checkout = await tx.checkout.findUnique({ where: { id: checkoutId }, include: { items: true } });
    if (!checkout) throw new Error("Checkout not found");

    // Create order and items
    const order = await tx.order.create({
      data: {
        userId: checkout.userId,
        totalPrice: checkout.totalPrice,
        pickUpTime: checkout.pickUpTime,
        orderItems: {
          create: checkout.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            notes: i.notes,
            ...(i.sideId && {
              orderItemSide: { create: { sideId: i.sideId } },
            }),
          })),
        },
      },
    });

    return order.id;
  }

  private async broadcastOrderCreation(orderId: number): Promise<void> {
    try {
      const orderService = new OrderService();
      const fullOrder = await orderService['orderRepository'].findById(orderId);
      
      if (fullOrder) {
        // Broadcast new order event
        const orderResponse = orderService['mapOrderToResponse'](fullOrder);
        await broadcastNewOrder(orderResponse);

        // Broadcast shift summary update
        await this.broadcastShiftSummaryForOrder(fullOrder, orderService);
      }
    } catch (error) {
      console.error('Error broadcasting order from checkout:', error);
      // Don't throw - this is non-critical for order creation
    }
  }

  private async broadcastShiftSummaryForOrder(order: any, orderService: OrderService): Promise<void> {
    try {
      // Determine which shift the order belongs to
      const pickupHour = new Date(order.pickUpTime).getHours();
      const shift = shiftsConfig.getShiftFromUTCHour(pickupHour);
      
      // Get shift summary
      const shiftSummary = await orderService.getShiftSummary(shift);
      if (shiftSummary.success && shiftSummary.data) {
        await broadcastShiftSummaryUpdate(shiftSummary.data);
      }

      // Also broadcast 'all' shifts
      const allShiftsSummary = await orderService.getShiftSummary('all');
      if (allShiftsSummary.success && allShiftsSummary.data) {
        await broadcastShiftSummaryUpdate(allShiftsSummary.data);
      }
    } catch (error) {
      console.error('Error broadcasting shift summary:', error);
    }
  }
}


