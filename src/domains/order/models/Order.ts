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
        nationalId?: string;
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

export interface OrderPaginatedResponse {
    success: boolean;
    message: string;
    data?: OrderResponse[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
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

export interface OrderSummary {
    id: number;
    name: string;
    totalToPrepare: number;
    preparedQuantity: number;
    remainingToPrepare: number;
    photo?: string;
}

export interface SideSummary {
    id: number;
    name: string;
    totalToPrepare: number;
    preparedQuantity: number;
    remainingToPrepare: number;
}

export interface ShiftSummaryResponse {
    success: boolean;
    message: string;
    data?: {
        shift: string;
        mainDishes: OrderSummary[];
        sides: SideSummary[];
        totalMainDishes: number;
        totalSides: number;
    };
}
