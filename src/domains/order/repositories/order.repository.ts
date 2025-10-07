import { PrismaClient, Prisma, OrderStatus } from "@prisma/client";
import {
  CreateOrderRequest,
  UpdateOrderStatusRequest,
} from "../models/Order.js";
import { prisma } from "../../../lib/prisma.js";
import { shiftsConfig } from "../../../config/shifts.config.js";

// Use Prisma types
type Order = Prisma.OrderGetPayload<{
  include: {
    user: true;
    orderItems: {
      include: {
        product: true;
        orderItemSide: {
          include: {
            side: true;
          };
        };
      };
    };
  };
}>;

export class OrderRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(orderData: CreateOrderRequest): Promise<Order> {
    const { userId, items, pickUpTime } = orderData;

    // Use a transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // First, validate and reserve stock for all products
      await this.validateAndReserveStock(tx, items);

      const totalPrice = await this.calculateTotalPrice(tx, items);

      return await tx.order.create({
        data: {
          userId,
          totalPrice,
          pickUpTime: new Date(pickUpTime),
          orderItems: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: 0, // Will be calculated
              notes: item.notes,
              ...(item.sideId && {
                orderItemSide: {
                  create: {
                    sideId: item.sideId,
                  },
                },
              }),
            })),
          },
        },
        include: {
          user: true,
          orderItems: {
            include: {
              product: true,
              orderItemSide: {
                include: {
                  side: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async findById(id: number): Promise<Order | null> {
    return await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
            orderItemSide: {
              include: {
                side: true,
              },
            },
          },
        },
      },
    });
  }

  async findByUserId(userId: number): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: { userId },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
            orderItemSide: {
              include: {
                side: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    return await this.prisma.$transaction(async (tx) => {
      // If cancelling an order, restore stock
      if (status === OrderStatus.CANCELLED) {
        await this.restoreStock(tx, id);
      }

      return await tx.order.update({
        where: { id },
        data: { status },
        include: {
          user: true,
          orderItems: {
            include: {
              product: true,
              orderItemSide: {
                include: {
                  side: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async countByUserId(userId: number): Promise<number> {
    return await this.prisma.order.count({
      where: { userId },
    });
  }

  async findWithFilters(filters: {
    page: number;
    limit: number;
    nationalId?: string;
    orderId?: number;
    userName?: string;
    shift?: string;
  }): Promise<{ orders: Order[]; total: number; totalPages: number }> {
    const { page, limit, nationalId, orderId, userName, shift } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.OrderWhereInput = {};

    if (orderId) {
      where.id = orderId;
    }

    if (nationalId || userName) {
      where.user = {};
      if (nationalId) {
        where.user.national_id = { contains: nationalId, mode: "insensitive" };
      }
      if (userName) {
        where.user.name = { contains: userName, mode: "insensitive" };
      }
    }

    // Handle date and shift filtering based on pickUpTime (Argentina timezone)
    const ARG_TZ = "America/Argentina/Buenos_Aires";

    // Get today's date in Argentina timezone
    const now = new Date();
    const todayInARG = new Intl.DateTimeFormat("en-CA", {
      timeZone: ARG_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    // Parse the date components
    const [year, month, day] = todayInARG.split("-").map(Number);

    if (shift && shift !== "all") {
      // Filter by specific shift of today
      const shiftDetails = shiftsConfig.getShiftByLabel(shift);
      
      if (shiftDetails) {
        // Create date range for today in Argentina timezone
        const shiftStart = new Date(year, month - 1, day, shiftDetails.startHour, shiftDetails.startMinute, 0, 0);
        const shiftEnd = new Date(year, month - 1, day, shiftDetails.endHour, shiftDetails.endMinute, 0, 0);

        where.pickUpTime = {
          gte: shiftStart,
          lt: shiftEnd,
        };
      } else {
        // If shift is not recognized, show all shifts for the day
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

        where.pickUpTime = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    } else {
      // Default and shift=all: show only today's orders (all shifts)
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      where.pickUpTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: true,
          orderItems: {
            include: {
              product: true,
              orderItemSide: {
                include: {
                  side: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      total,
      totalPages,
    };
  }

  private async calculateTotalPrice(
    tx: any,
    items: CreateOrderRequest["items"]
  ): Promise<number> {
    let total = 0;

    for (const item of items) {
      const product = await tx.product.findFirst({
        where: {
          id: item.productId,
          deletedAt: null, // Only include products that are not deleted
        },
      });

      if (product) {
        total += product.price * item.quantity;
      }
    }

    return total;
  }

  private async validateAndReserveStock(
    tx: any,
    items: CreateOrderRequest["items"]
  ): Promise<void> {
    const unavailableProducts: {
      id: number;
      name: string;
      requested: number;
      available: number;
    }[] = [];

    // Get all products with their current stock (only non-deleted products)
    const productIds = items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null, // Only include products that are not deleted
      },
      select: { id: true, name: true, stock: true },
    });

    // Create a map for quick lookup
    const productMap = new Map<
      number,
      { id: number; name: string; stock: number }
    >(
      products.map((p: { id: number; name: string; stock: number }) => [
        p.id,
        p,
      ])
    );

    // Check stock availability for each item
    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        unavailableProducts.push({
          id: product.id,
          name: product.name,
          requested: item.quantity,
          available: product.stock,
        });
      }
    }

    // If any products are unavailable, throw an error with details
    if (unavailableProducts.length > 0) {
      const errorMessage = unavailableProducts
        .map(
          (p) =>
            `${p.name} (ID: ${p.id}): requested ${p.requested}, available ${p.available}`
        )
        .join("; ");
      throw new Error(`Insufficient stock for products: ${errorMessage}`);
    }

    // Reserve stock by updating each product with atomic check
    for (const item of items) {
      const updatedProduct = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.quantity }, // Only update if stock is sufficient
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      // If no rows were updated, it means stock was insufficient
      if (updatedProduct.count === 0) {
        const product = productMap.get(item.productId);
        throw new Error(
          `Insufficient stock for product ${product?.name} (ID: ${item.productId}): requested ${item.quantity}, but stock was insufficient`
        );
      }
    }
  }

  private async restoreStock(tx: any, orderId: number): Promise<void> {
    // Get all order items for this order
    const orderItems = await tx.orderItem.findMany({
      where: { orderId },
      select: { productId: true, quantity: true },
    });

    // Restore stock for each product
    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }
  }

  async validateProductsExist(
    productIds: number[]
  ): Promise<{ found: number[]; missing: number[] }> {
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null, // Only include products that are not deleted
      },
      select: { id: true },
    });

    const foundIds = products.map((p) => p.id);
    const missingIds = productIds.filter((id) => !foundIds.includes(id));

    return { found: foundIds, missing: missingIds };
  }

  async validateSidesExist(
    sideIds: number[]
  ): Promise<{ found: number[]; missing: number[] }> {
    if (sideIds.length === 0) {
      return { found: [], missing: [] };
    }

    const sides = await this.prisma.side.findMany({
      where: { id: { in: sideIds } },
      select: { id: true },
    });

    const foundIds = sides.map((s) => s.id);
    const missingIds = sideIds.filter((id) => !foundIds.includes(id));

    return { found: foundIds, missing: missingIds };
  }

  async validateProductSideCompatibility(
    items: CreateOrderRequest["items"]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const item of items) {
      if (item.sideId) {
        const productSideRelation = await this.prisma.product.findFirst({
          where: {
            id: item.productId,
            sides: {
              some: {
                id: item.sideId,
              },
            },
          },
          select: { id: true },
        });

        if (!productSideRelation) {
          errors.push(
            `Product ID ${item.productId} does not accept side ID ${item.sideId}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async getShiftSummary(shift: string): Promise<{
    mainDishes: Array<{
      id: number;
      name: string;
      totalToPrepare: number;
      preparedQuantity: number;
      photo?: string;
    }>;
    sides: Array<{
      id: number;
      name: string;
      totalToPrepare: number;
      preparedQuantity: number;
    }>;
  }> {
    // Always use current date
    const targetDate = new Date().toISOString().split("T")[0];

    // Get date components (YYYY-MM-DD format)
    const [year, month, day] = targetDate.split("-").map(Number);

    let startHour: number, startMinute: number, endHour: number, endMinute: number;

    if (shift === "all") {
      // For 'all' shift, get all orders for the day
      startHour = 0;
      startMinute = 0;
      endHour = 23;
      endMinute = 59;
    } else {
      // Map shift strings to hour ranges using dynamic configuration
      const shiftDetails = shiftsConfig.getShiftByLabel(shift);
      
      if (!shiftDetails) {
        // If shift is not recognized, return empty results
        return {
          mainDishes: [],
          sides: [],
        };
      }
      
      startHour = shiftDetails.startHour;
      startMinute = shiftDetails.startMinute;
      endHour = shiftDetails.endHour;
      endMinute = shiftDetails.endMinute;
    }

    // Create date range for the shift
    const shiftStart = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
    const shiftEnd = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

    // Get all orders for the shift
    const orders = await this.prisma.order.findMany({
      where: {
        pickUpTime: {
          gte: shiftStart,
          lte: shiftEnd,
        },
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
            orderItemSide: {
              include: {
                side: true,
              },
            },
          },
        },
      },
    });

    // Aggregate main dishes (products)
    const mainDishesMap = new Map<
      number,
      {
        id: number;
        name: string;
        totalToPrepare: number;
        preparedQuantity: number;
        photo?: string;
      }
    >();

    // Aggregate sides
    const sidesMap = new Map<
      number,
      {
        id: number;
        name: string;
        totalToPrepare: number;
        preparedQuantity: number;
      }
    >();

    // Process each order
    for (const order of orders) {
      for (const item of order.orderItems) {
        // Count main dishes (products)
        const productId = item.productId;
        const productName = item.product.name;
        const productPhoto = item.product.photo;
        const quantity = item.quantity;

        // Calculate prepared quantity based on order status
        const isDelivered = order.status === "DELIVERED";
        const preparedQuantity = isDelivered ? quantity : 0;

        if (mainDishesMap.has(productId)) {
          const existing = mainDishesMap.get(productId)!;
          existing.totalToPrepare += quantity;
          existing.preparedQuantity += preparedQuantity;
        } else {
          mainDishesMap.set(productId, {
            id: productId,
            name: productName,
            totalToPrepare: quantity,
            preparedQuantity: preparedQuantity,
            photo: productPhoto || undefined,
          });
        }

        // Count sides if present
        if (item.orderItemSide) {
          const sideId = item.orderItemSide.sideId;
          const sideName = item.orderItemSide.side.name;

          if (sidesMap.has(sideId)) {
            const existing = sidesMap.get(sideId)!;
            existing.totalToPrepare += quantity;
            existing.preparedQuantity += preparedQuantity;
          } else {
            sidesMap.set(sideId, {
              id: sideId,
              name: sideName,
              totalToPrepare: quantity,
              preparedQuantity: preparedQuantity,
            });
          }
        }
      }
    }

    return {
      mainDishes: Array.from(mainDishesMap.values()),
      sides: Array.from(sidesMap.values()),
    };
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
