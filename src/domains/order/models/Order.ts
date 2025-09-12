import { OrderStatus } from '@prisma/client';

export interface CreateOrderItemRequest {
    productId: number;
    quantity: number;
    sideId?: number;
    notes?: string;
}

export interface CreateOrderRequest {
    userId: number;
    items: CreateOrderItemRequest[];
    pickUpTime: string; // ISO string
}

export interface UpdateOrderStatusRequest {
    status: OrderStatus;
}

export interface OrderItemResponse {
    id: number;
    productId: number;
    product: {
        id: number;
        name: string;
        price: number;
        photo?: string;
    };
    quantity: number;
    unitPrice: number;
    notes?: string;
    side?: {
        id: number;
        name: string;
    };
}

export interface OrderResponse {
    id: number;
    userId: number;
    user: {
        id: number;
        name?: string;
        email: string;
    };
    status: OrderStatus;
    totalPrice: number;
    pickUpTime: Date;
    createdAt: Date;
    updatedAt: Date;
    orderItems: OrderItemResponse[];
}

export interface OrderListResponse {
    success: boolean;
    message: string;
    data?: OrderResponse[];
    total?: number;
}

export interface OrderSingleResponse {
    success: boolean;
    message: string;
    data?: OrderResponse;
}

export interface OrderCreateResponse {
    success: boolean;
    message: string;
    data?: {
        id: number;
        status: OrderStatus;
        totalPrice: number;
    };
}

export interface OrderUpdateResponse {
    success: boolean;
    message: string;
    data?: OrderResponse;
}