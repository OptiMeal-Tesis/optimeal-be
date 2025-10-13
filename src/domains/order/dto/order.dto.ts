import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
import { shiftsConfig } from '../../../config/shifts.config.js';

export const CreateOrderItemDTO = z.object({
    productId: z.number().int().positive('Product ID must be a positive integer'),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    sideId: z.number().int().positive('Side ID must be a positive integer').optional(),
    notes: z.string().min(1, 'Notes cannot be empty').optional(),
});

export const CreateOrderDTO = z.object({
    items: z.array(CreateOrderItemDTO).min(1, 'Order must contain at least one item'),
    pickUpTime: z.string().datetime('Pickup time must be a valid ISO datetime'),
});

export const UpdateOrderStatusDTO = z.object({
    status: z.nativeEnum(OrderStatus, {
        message: 'Invalid order status'
    }),
});

export const OrderIdParamDTO = z.object({
    id: z.string().transform((val) => {
        const num = parseInt(val, 10);
        if (isNaN(num) || num <= 0) {
            throw new Error('ID must be a positive integer');
        }
        return num;
    }),
});

export const OrderQueryParamsDTO = z.object({
    page: z.string().optional().transform((val) => {
        if (!val) return 1;
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1) {
            throw new Error('Page must be a positive integer');
        }
        return num;
    }),
    limit: z.string().optional().transform((val) => {
        if (!val) return 10;
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1 || num > 100) {
            throw new Error('Limit must be between 1 and 100');
        }
        return num;
    }),
    nationalId: z.string().optional(),
    orderId: z.string().optional().transform((val) => {
        if (!val) return undefined;
        const num = parseInt(val, 10);
        if (isNaN(num) || num <= 0) {
            throw new Error('Order ID must be a positive integer');
        }
        return num;
    }),
    userName: z.string().optional(),
    shift: z.string().optional().transform((val) => {
        if (!val) return undefined;
        const resolved = shiftsConfig.getShiftByLabel(val);
        if (!resolved) {
            const valid = shiftsConfig.getValidShifts().join(', ');
            throw new Error(`Shift must be one of: ${valid}`);
        }
        // Normalize to the configured label so downstream uses consistent value
        return resolved.label;
    }),
});

export const ShiftDishesQueryDTO = z.object({
    shift: z.string().transform((val) => {
        const resolved = shiftsConfig.getShiftByLabel(val);
        if (!resolved) {
            const valid = shiftsConfig.getValidShifts().join(', ');
            throw new Error(`Shift must be one of: ${valid}`);
        }
        return resolved.label;
    }),
    date: z.string().optional().transform((val) => {
        if (!val) return new Date().toISOString().split('T')[0]; // Default to today
        const date = new Date(val);
        if (isNaN(date.getTime())) {
            throw new Error('Date must be a valid date in YYYY-MM-DD format');
        }
        return val;
    }),
});
