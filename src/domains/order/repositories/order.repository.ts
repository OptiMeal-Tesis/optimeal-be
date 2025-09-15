import { PrismaClient, Prisma, OrderStatus } from '@prisma/client';
import { CreateOrderRequest, UpdateOrderStatusRequest } from '../models/Order.js';
import { prisma } from '../../../lib/prisma.js';

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

        const totalPrice = await this.calculateTotalPrice(items);

        return await this.prisma.order.create({
            data: {
                userId,
                totalPrice,
                pickUpTime: new Date(pickUpTime),
                orderItems: {
                    create: items.map(item => ({
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
            orderBy: { createdAt: 'desc' },
        });
    }


    async updateStatus(id: number, status: OrderStatus): Promise<Order> {
        return await this.prisma.order.update({
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
                where.user.national_id = { contains: nationalId, mode: 'insensitive' };
            }
            if (userName) {
                where.user.name = { contains: userName, mode: 'insensitive' };
            }
        }

        // Handle shift filtering based on pickUpTime
        if (shift && shift !== 'all') {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            let startHour: number, endHour: number;
            
            switch (shift) {
                case '11-12':
                    startHour = 11;
                    endHour = 12;
                    break;
                case '12-13':
                    startHour = 12;
                    endHour = 13;
                    break;
                case '13-14':
                    startHour = 13;
                    endHour = 14;
                    break;
                case '14-15':
                    startHour = 14;
                    endHour = 15;
                    break;
                default:
                    startHour = 0;
                    endHour = 23;
            }

            const shiftStart = new Date(startOfDay);
            shiftStart.setHours(startHour, 0, 0, 0);
            
            const shiftEnd = new Date(startOfDay);
            shiftEnd.setHours(endHour, 0, 0, 0);

            where.pickUpTime = {
                gte: shiftStart,
                lt: shiftEnd,
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
                orderBy: { createdAt: 'desc' },
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

    private async calculateTotalPrice(items: CreateOrderRequest['items']): Promise<number> {
        let total = 0;

        for (const item of items) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
            });

            if (product) {
                total += product.price * item.quantity;
            }
        }

        return total;
    }

    async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
    }
}
