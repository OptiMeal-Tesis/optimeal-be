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

    async findAll(): Promise<Order[]> {
        return await this.prisma.order.findMany({
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

    async count(): Promise<number> {
        return await this.prisma.order.count();
    }

    async countByUserId(userId: number): Promise<number> {
        return await this.prisma.order.count({
            where: { userId },
        });
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
