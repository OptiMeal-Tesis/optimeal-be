import { PrismaClient, Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { StatsQueryParams, OrderStats, StatsSummary } from "../models/Stats.js";

export class StatsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async getOrdersWithStats(params: StatsQueryParams): Promise<{
    orders: OrderStats[];
    summary: StatsSummary;
    total: number;
  }> {
    const { start_date, end_date, search } = params;

    // Parse dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    // Build where clause
    const where: Prisma.OrderWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Add search filters if provided
    if (search) {
      where.OR = [
        { id: { equals: parseInt(search) || 0 } },
        { user: { national_id: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get orders with all necessary relations
    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            national_id: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                photo: true,
              },
            },
            orderItemSide: {
              include: {
                side: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary statistics
    const summary = this.calculateSummary(orders);

    return {
      orders,
      summary,
      total: orders.length,
    };
  }

  async getOrdersWithStatsPaginated(
    params: StatsQueryParams & { page: number; limit: number }
  ): Promise<{
    orders: OrderStats[];
    summary: StatsSummary;
    total: number;
    totalPages: number;
  }> {
    const { start_date, end_date, search, page, limit } = params;
    const skip = (page - 1) * limit;

    // Parse dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    // Build where clause
    const where: Prisma.OrderWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Add search filters if provided
    if (search) {
      where.OR = [
        { id: { equals: parseInt(search) || 0 } },
        { user: { national_id: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              national_id: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  photo: true,
                },
              },
              orderItemSide: {
                include: {
                  side: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
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

    // Calculate summary statistics from all orders in the date range (not just paginated)
    const allOrders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            national_id: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                photo: true,
              },
            },
            orderItemSide: {
              include: {
                side: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const summary = this.calculateSummary(allOrders);
    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      summary,
      total,
      totalPages,
    };
  }

  private calculateSummary(orders: any[]): StatsSummary {
    const totalRevenue = orders.reduce((sum, order) => {
      return order.status !== OrderStatus.CANCELLED
        ? sum + order.totalPrice
        : sum;
    }, 0);

    const totalOrders = orders.length;
    const cancelledOrders = orders.filter(
      (order) => order.status === OrderStatus.CANCELLED
    ).length;
    const deliveredOrders = orders.filter(
      (order) => order.status === OrderStatus.DELIVERED
    ).length;

    return {
      totalRevenue,
      totalOrders,
      cancelledOrders,
      deliveredOrders,
    };
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
