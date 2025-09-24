import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "../../../lib/prisma.js";
import { OrderService } from "../../order/services/order.service.js";
import { CheckoutRequest } from "../dto/payment.dto.js";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

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
    // Reuse validations from OrderService
    const orderService = new OrderService();
    orderService["validateCreateOrderRequest"](request as any);
    await orderService["validateProductsExist"](request.items as any);
    await orderService["validateSidesExist"](request.items as any);
    await orderService["validateProductSideCompatibility"](request.items as any);

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Calculate total price same as order repo
        let total = 0;
        for (const item of request.items) {
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
        for (const item of request.items) {
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
            userId: request.userId,
            status: "PENDING",
            totalPrice: total,
            pickUpTime: new Date(request.pickUpTime),
            externalReference,
            items: {
              create: request.items.map((i) => ({
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
          items: await Promise.all(
            request.items.map(async (i) => {
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
          for (const item of request.items) {
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

  async handleMercadoPagoWebhook(payload: any): Promise<void> {
    const { data, type } = payload || {};
    if (!type || !data || !data.id) return;

    // In production: verify signature header and fetch payment details from MP
    // For now, we assume external_reference is available via preference lookup or payment lookup

    // Fetch payment info
    const { Payment } = await import("mercadopago");
    const payment = new Payment(this.client);
    const paymentData = await payment.get({ id: data.id });
    const status = paymentData.status as string;
    const externalReference = paymentData.external_reference as string;

    const checkout = await prisma.checkout.findFirst({ where: { externalReference }, include: { items: true } });
    if (!checkout) return;

    if (status === "approved") {
      // Create order and finalize
      await prisma.$transaction(async (tx) => {
        // Create the order using repository to keep mapping same
        await this.createOrderFromCheckout(tx, checkout.id);
        await tx.checkout.update({ where: { id: checkout.id }, data: { status: "APPROVED" } });
      });
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

  private async createOrderFromCheckout(tx: Prisma.TransactionClient, checkoutId: number): Promise<void> {
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
  }
}


