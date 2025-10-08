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
import { broadcastNewOrder, broadcastOrderStatusUpdate, broadcastShiftSummaryUpdate } from "../../../lib/supabase-realtime.js";
import { shiftsConfig } from "../../../config/shifts.config.js";

export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  async createOrder(
    orderData: CreateOrderRequest
  ): Promise<OrderCreateResponse> {
    try {
      // this.validateCreateOrderRequest(orderData);

      // Validate that all products exist and are available
      await this.validateProductsExist(orderData.items);

      // Validate that sides exist if provided
      await this.validateSidesExist(orderData.items);

      // Validate that sides are compatible with products
      await this.validateProductSideCompatibility(orderData.items);

      const order = await this.orderRepository.create(orderData);

      // Get full order details for broadcast
      const fullOrder = await this.orderRepository.findById(order.id);
      
      if (fullOrder) {
        // Broadcast new order to Supabase Realtime
        await broadcastNewOrder(this.mapOrderToResponse(fullOrder));

        // Broadcast updated shift summary (since new order affects the shift)
        await this.broadcastShiftSummaryForOrder(fullOrder);
      }

      return {
        success: true,
        message: "Orden creada exitosamente",
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
          message: "No se encontró la orden",
        };
      }

      return {
        success: true,
        message: "Orden encontrada",
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
        message: "Ordenes recuperadas exitosamente",
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
        message: "Ordenes encontradas exitosamente",
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
          message: "Orden no encontrada",
        };
      }

      this.validateStatusTransition(existingOrder.status, status);

      const updatedOrder = await this.orderRepository.updateStatus(id, status);

      // Broadcast status update to Supabase Realtime
      await broadcastOrderStatusUpdate(
        this.mapOrderToResponse(updatedOrder),
        existingOrder.status,
        status
      );

      // Broadcast updated shift summary (since status change affects shift quantities)
      await this.broadcastShiftSummaryForOrder(updatedOrder);

      return {
        success: true,
        message: "Estado de la orden actualizado exitosamente",
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
      throw new Error("Se requiere un ID de usuario válido");
    }

    if (!request.items || request.items.length === 0) {
      throw new Error("La orden debe contener al menos un ítem");
    }

    if (!request.pickUpTime) {
      throw new Error("El horario de retiro de la orden es obligatorio");
    }

    // UTC validations
    const pickupDate = new Date(request.pickUpTime);
    const now = new Date();

    // Get date strings for comparison (YYYY-MM-DD format)
    const nowDateStr = now.toISOString().split("T")[0];
    const pickupDateStr = pickupDate.toISOString().split("T")[0];

    // Validate same day
    if (nowDateStr !== pickupDateStr) {
      throw new Error("El horario de retiro debe ser el mismo día");
    }

    // Validate future time
    if (pickupDate <= now) {
      throw new Error("El horario de retiro debe ser en el futuro");
    }

    // Validate shift hours using dynamic shifts configuration
    const pickupHour = pickupDate.getHours();
    const validUTCHours = shiftsConfig.getValidUTCHours();
    if (!validUTCHours.includes(pickupHour)) {
      const shiftRange = shiftsConfig.getShiftHourRange();
      throw new Error(
        `El horario de retiro debe estar entre las ${shiftRange.minHour}:00 y ${shiftRange.maxHour}:00 hora Argentina`
      );
    }

    // Validate each item
    request.items.forEach((item, index) => {
      if (!item.productId || item.productId <= 0) {
        throw new Error(`Item ${index + 1}: Se requiere un ID de producto válido`);
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Item ${index + 1}: La cantidad debe ser mayor a 0`);
      }

      if (item.sideId && item.sideId <= 0) {
        throw new Error(`Item ${index + 1}: Se requiere un ID de guarnición válido`);
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
      throw new Error(`Productos no encontrados: ${missing.join(", ")}`);
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
      throw new Error(`Guarniciones no encontradas: ${missing.join(", ")}`);
    }
  }

  private async validateProductSideCompatibility(
    items: CreateOrderRequest["items"]
  ): Promise<void> {
    const { valid, errors } =
      await this.orderRepository.validateProductSideCompatibility(items);

    if (!valid) {
      throw new Error(
        `Error de compatibilidad Producto-Guarnición: ${errors.join(", ")}`
      );
    }
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ): void {
    const isForbiddenCancellation =
      newStatus === OrderStatus.CANCELLED &&
      (currentStatus === OrderStatus.READY || currentStatus === OrderStatus.DELIVERED);

    if (isForbiddenCancellation) {
      throw new Error(
        `No puede pasar de estado ${currentStatus} a ${newStatus}`
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
        message: "Platos del turno recuperados exitosamente",
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

  async getAvailableShifts(): Promise<{ success: boolean; message: string; data?: string[] }> {
    try {
      const shifts = shiftsConfig.getValidShifts();
      return {
        success: true,
        message: "Available shifts retrieved successfully",
        data: shifts,
      };
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  private validateShiftDishesParams(shift: string): ShiftSummaryResponse {
    const validShifts = shiftsConfig.getValidShifts();

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

  /**
   * Helper method to broadcast shift summary update when an order changes
   */
  private async broadcastShiftSummaryForOrder(order: any): Promise<void> {
    try {
      // Determine which shift the order belongs to based on pickUpTime
      const pickupHour = new Date(order.pickUpTime).getHours();
      const shift = shiftsConfig.getShiftFromUTCHour(pickupHour);
      
      // Get shift summary for the specific shift
      const shiftSummary = await this.getShiftSummary(shift);
      
      if (shiftSummary.success && shiftSummary.data) {
        await broadcastShiftSummaryUpdate(shiftSummary.data);
      }

      // Also broadcast summary for 'all' shifts
      const allShiftsSummary = await this.getShiftSummary('all');
      if (allShiftsSummary.success && allShiftsSummary.data) {
        await broadcastShiftSummaryUpdate(allShiftsSummary.data);
      }
    } catch (error) {
      console.error('Error broadcasting shift summary:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  private getErrorMessage(error: any): string {
    if (error.code === "P2002") {
      return "A record with this data already exists";
    }
    if (error.code === "P2025") {
      return "Order not found";
    }
    // Handle stock-related errors
    if (error.message && error.message.includes("Stock Insuficiente")) {
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
    if (
      error.message &&
      error.message.includes("Product-Side compatibility errors")
    ) {
      return error.message;
    }
    return error.message || "Internal server error";
  }
}
