import { OrderStatus } from "@prisma/client";

export interface StatsQueryParams {
  start_date: string;
  end_date: string;
  search?: string; // For filtering by order ID, national ID, or customer name
}

export interface OrderStats {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string | null;
    email: string;
    national_id: string;
  };
  status: OrderStatus;
  totalPrice: number;
  shift: string;
  createdAt: Date;
  updatedAt: Date;
  orderItems: {
    id: number;
    productId: number;
    product: {
      id: number;
      name: string;
      price: number;
      photo: string | null;
    };
    quantity: number;
    unitPrice: number;
    notes: string | null;
    orderItemSide: {
      side: {
        id: number;
        name: string;
      };
    } | null;
  }[];
}

export interface StatsSummary {
  totalRevenue: number;
  totalOrders: number;
  cancelledOrders: number;
  deliveredOrders: number;
}

export interface StatsResponse {
  success: boolean;
  message: string;
  data?: {
    summary: StatsSummary;
    orders: OrderStats[];
    total: number;
  };
}

export interface StatsQueryResponse {
  success: boolean;
  message: string;
  data?: {
    summary: StatsSummary;
    orders: OrderStats[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
