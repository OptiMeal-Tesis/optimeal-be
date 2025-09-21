import { OrderRepository } from "../repositories/order.repository.js";
import { Prisma, OrderStatus } from "@prisma/client";
import {
  CreateOrderRequest,
  OrderResponse,
  OrderListResponse,
  OrderPaginatedResponse,
  OrderSingleResponse,
  OrderCreateResponse,
  OrderUpdateResponse,
  OrderItemResponse,
  SideSummary,
  ShiftSummaryResponse,
  OrderSummary,
} from "../models/Order.js";

export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  async createOrder(
    orderData: CreateOrderRequest
  ): Promise<OrderCreateResponse> {
    try {
      this.validateCreateOrderRequest(orderData);

      // Validate that all products exist and are available
      await this.validateProductsExist(orderData.items);

      // Validate that sides exist if provided
      await this.validateSidesExist(orderData.items);

      const order = await this.orderRepository.create(orderData);

      return {
        success: true,
        message: "Order created successfully",
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
          message: "Order not found",
        };
      }

      return {
        success: true,
        message: "Order retrieved successfully",
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
        message: "Orders retrieved successfully",
        data: orders.map((order) => this.mapOrderToResponse(order)),
        total,
      };
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  async getOrdersWithFilters(filters: {
    page: number;
    limit: number;
    nationalId?: string;
    orderId?: number;
    userName?: string;
    shift?: string;
  }): Promise<OrderPaginatedResponse> {
    try {
      const { orders, total, totalPages } =
        await this.orderRepository.findWithFilters(filters);

      return {
        success: true,
        message: "Orders retrieved successfully",
        data: orders.map((order) => this.mapOrderToResponse(order)),
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  async updateOrderStatus(
    id: number,
    status: OrderStatus
  ): Promise<OrderUpdateResponse> {
    try {
      // Check if order exists
      const existingOrder = await this.orderRepository.findById(id);
      if (!existingOrder) {
        return {
          success: false,
          message: "Order not found",
        };
      }

      this.validateStatusTransition(existingOrder.status, status);

      const updatedOrder = await this.orderRepository.updateStatus(id, status);

      return {
        success: true,
        message: "Order status updated successfully",
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
      throw new Error("Valid user ID is required");
    }

    if (!request.items || request.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    if (!request.pickUpTime) {
      throw new Error("Pickup time is required");
    }

    // UTC validations
    const pickupDate = new Date(request.pickUpTime);
    const now = new Date();

    // Get date strings for comparison (YYYY-MM-DD format)
    const nowDateStr = now.toISOString().split("T")[0];
    const pickupDateStr = pickupDate.toISOString().split("T")[0];

    // Validate same day
    if (nowDateStr !== pickupDateStr) {
      throw new Error("Pickup time must be for today");
    }

    // Validate future time
    if (pickupDate <= now) {
      throw new Error("Pickup time must be in the future");
    }

    // Validate shift hours (14-18 UTC, which corresponds to 11-15 Argentina time)
    const pickupHour = pickupDate.getHours();
    if (![14, 15, 16, 17, 18].includes(pickupHour)) {
      throw new Error(
        "Pickup time must be within allowed shifts (11-15 Argentina time)"
      );
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

  private async validateProductsExist(
    items: CreateOrderRequest["items"]
  ): Promise<void> {
    const productIds = items.map((item) => item.productId);
    const { missing } = await this.orderRepository.validateProductsExist(
      productIds
    );

    if (missing.length > 0) {
      throw new Error(`Products not found: ${missing.join(", ")}`);
    }
  }

  private async validateSidesExist(
    items: CreateOrderRequest["items"]
  ): Promise<void> {
    const sideIds = items
      .filter((item) => item.sideId)
      .map((item) => item.sideId!);
    const { missing } = await this.orderRepository.validateSidesExist(sideIds);

    if (missing.length > 0) {
      throw new Error(`Sides not found: ${missing.join(", ")}`);
    }
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
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
        nationalId: order.user.national_id,
      },
      status: order.status,
      totalPrice: order.totalPrice,
      pickUpTime: order.pickUpTime,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderItems: order.orderItems.map((item: any) =>
        this.mapOrderItemToResponse(item)
      ),
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
      side: item.orderItemSide?.side
        ? {
            id: item.orderItemSide.side.id,
            name: item.orderItemSide.side.name,
          }
        : undefined,
    };
  }

  async getShiftSummary(shift: string): Promise<ShiftSummaryResponse> {
    try {
      // Use 'all' as default if no shift provided
      const shiftToUse = shift || "all";

      // Validate parameters
      const validationResult = this.validateShiftDishesParams(shiftToUse);
      if (!validationResult.success) {
        return validationResult;
      }

      const { mainDishes, sides } = await this.orderRepository.getShiftSummary(
        shiftToUse
      );

      // Calculate remaining quantities
      const mainDishesWithRemaining: OrderSummary[] = mainDishes.map(
        (dish) => ({
          ...dish,
          remainingToPrepare: dish.totalToPrepare - dish.preparedQuantity,
        })
      );

      const sidesWithRemaining: SideSummary[] = sides.map((side) => ({
        ...side,
        remainingToPrepare: side.totalToPrepare - side.preparedQuantity,
      }));

      // Calculate totals
      const totalMainDishes = mainDishesWithRemaining.reduce(
        (sum, dish) => sum + dish.totalToPrepare,
        0
      );
      const totalSides = sidesWithRemaining.reduce(
        (sum, side) => sum + side.totalToPrepare,
        0
      );

      return {
        success: true,
        message: "Dishes retrieved successfully",
        data: {
          shift: shiftToUse,
          mainDishes: mainDishesWithRemaining,
          sides: sidesWithRemaining,
          totalMainDishes,
          totalSides,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  private validateShiftDishesParams(shift: string): ShiftSummaryResponse {
    const validShifts = ["11-12", "12-13", "13-14", "14-15", "all"];

    // Use 'all' as default if no shift provided
    const shiftToValidate = shift || "all";

    if (!validShifts.includes(shiftToValidate)) {
      return {
        success: false,
        message: `Invalid shift. Valid values are: ${validShifts.join(", ")}`,
      };
    }

    return {
      success: true,
      message: "Parameters are valid",
    };
  }

  private getErrorMessage(error: any): string {
    if (error.code === "P2002") {
      return "A record with this data already exists";
    }
    if (error.code === "P2025") {
      return "Order not found";
    }
    // Handle stock-related errors
    if (error.message && error.message.includes("Insufficient stock")) {
      return error.message;
    }
    if (error.message && error.message.includes("Product with ID")) {
      return error.message;
    }
    if (error.message && error.message.includes("Sides not found")) {
      return error.message;
    }
    if (error.message && error.message.includes("Products not found")) {
      return error.message;
    }
    return error.message || "Internal server error";
  }
}
