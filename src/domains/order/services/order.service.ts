import { OrderRepository } from '../repositories/order.repository.js';
import { Prisma, OrderStatus } from '@prisma/client';
import {
    CreateOrderRequest,
    UpdateOrderStatusRequest,
    OrderResponse,
    OrderListResponse,
    OrderSingleResponse,
    OrderCreateResponse,
    OrderUpdateResponse,
    OrderItemResponse,
} from '../models/Order.js';

export class OrderService {
    private orderRepository: OrderRepository;

    constructor() {
        this.orderRepository = new OrderRepository();
    }

    async createOrder(orderData: CreateOrderRequest): Promise<OrderCreateResponse> {
        try {
            this.validateCreateOrderRequest(orderData);

            // Validate that all products exist and are available
            await this.validateProductsExist(orderData.items);

            // Validate that sides exist if provided
            await this.validateSidesExist(orderData.items);

            const order = await this.orderRepository.create(orderData);

            return {
                success: true,
                message: 'Order created successfully',
                data: {
                    id: order.id,
                    status: order.status,
                    totalPrice: order.totalPrice,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async getOrderById(id: number): Promise<OrderSingleResponse> {
        try {
            const order = await this.orderRepository.findById(id);

            if (!order) {
                return {
                    success: false,
                    message: 'Order not found',
                };
            }

            return {
                success: true,
                message: 'Order retrieved successfully',
                data: this.mapOrderToResponse(order),
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async getOrdersByUserId(userId: number): Promise<OrderListResponse> {
        try {
            const orders = await this.orderRepository.findByUserId(userId);
            const total = await this.orderRepository.countByUserId(userId);

            return {
                success: true,
                message: 'Orders retrieved successfully',
                data: orders.map(order => this.mapOrderToResponse(order)),
                total,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async getAllOrders(): Promise<OrderListResponse> {
        try {
            const orders = await this.orderRepository.findAll();
            const total = await this.orderRepository.count();

            return {
                success: true,
                message: 'Orders retrieved successfully',
                data: orders.map(order => this.mapOrderToResponse(order)),
                total,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async updateOrderStatus(id: number, status: OrderStatus): Promise<OrderUpdateResponse> {
        try {
            // Check if order exists
            const existingOrder = await this.orderRepository.findById(id);
            if (!existingOrder) {
                return {
                    success: false,
                    message: 'Order not found',
                };
            }

            this.validateStatusTransition(existingOrder.status, status);

            const updatedOrder = await this.orderRepository.updateStatus(id, status);

            return {
                success: true,
                message: 'Order status updated successfully',
                data: this.mapOrderToResponse(updatedOrder),
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    private validateCreateOrderRequest(request: CreateOrderRequest): void {
        if (!request.userId || request.userId <= 0) {
            throw new Error('Valid user ID is required');
        }

        if (!request.items || request.items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        if (!request.pickUpTime) {
            throw new Error('Pickup time is required');
        }

        // Validate pickup time is in the future
        const pickupDate = new Date(request.pickUpTime);
        const now = new Date();
        if (pickupDate <= now) {
            throw new Error('Pickup time must be in the future');
        }

        // Validate each item
        request.items.forEach((item, index) => {
            if (!item.productId || item.productId <= 0) {
                throw new Error(`Item ${index + 1}: Valid product ID is required`);
            }

            if (!item.quantity || item.quantity <= 0) {
                throw new Error(`Item ${index + 1}: Quantity must be greater than 0`);
            }

            if (item.sideId && item.sideId <= 0) {
                throw new Error(`Item ${index + 1}: Valid side ID is required`);
            }
        });
    }

    private async validateProductsExist(items: CreateOrderRequest['items']): Promise<void> {
        const productIds = items.map(item => item.productId);
        const products = await this.orderRepository['prisma'].product.findMany({
            where: { id: { in: productIds } },
        });

        if (products.length !== productIds.length) {
            const foundIds = products.map(p => p.id);
            const missingIds = productIds.filter(id => !foundIds.includes(id));
            throw new Error(`Products not found: ${missingIds.join(', ')}`);
        }
    }

    private async validateSidesExist(items: CreateOrderRequest['items']): Promise<void> {
        const sideIds = items.filter(item => item.sideId).map(item => item.sideId!);
        
        if (sideIds.length === 0) return;

        const sides = await this.orderRepository['prisma'].side.findMany({
            where: { id: { in: sideIds } },
        });

        if (sides.length !== sideIds.length) {
            const foundIds = sides.map(s => s.id);
            const missingIds = sideIds.filter(id => !foundIds.includes(id));
            throw new Error(`Sides not found: ${missingIds.join(', ')}`);
        }
    }

    private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
        const validTransitions: Record<OrderStatus, OrderStatus[]> = {
            [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
            [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
            [OrderStatus.READY]: [OrderStatus.DELIVERED],
            [OrderStatus.DELIVERED]: [],
            [OrderStatus.CANCELLED]: [],
        };

        if (!validTransitions[currentStatus].includes(newStatus)) {
            throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
        }
    }

    private mapOrderToResponse(order: any): OrderResponse {
        return {
            id: order.id,
            userId: order.userId,
            user: {
                id: order.user.id,
                name: order.user.name,
                email: order.user.email,
            },
            status: order.status,
            totalPrice: order.totalPrice,
            pickUpTime: order.pickUpTime,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            orderItems: order.orderItems.map((item: any) => this.mapOrderItemToResponse(item)),
        };
    }

    private mapOrderItemToResponse(item: any): OrderItemResponse {
        return {
            id: item.id,
            productId: item.productId,
            product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                photo: item.product.photo,
            },
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
            side: item.orderItemSide?.side ? {
                id: item.orderItemSide.side.id,
                name: item.orderItemSide.side.name,
            } : undefined,
        };
    }

    private getErrorMessage(error: any): string {
        if (error.code === 'P2002') {
            return 'A order with this data already exists';
        }
        if (error.code === 'P2025') {
            return 'Order not found';
        }
        return error.message || 'Internal server error';
    }
}
