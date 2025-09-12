import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

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
