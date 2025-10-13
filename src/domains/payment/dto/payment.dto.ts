import { z } from 'zod';
import { shiftsConfig } from '../../../config/shifts.config.js';

export const CheckoutItemDTO = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  sideId: z.number().int().positive('Side ID must be a positive integer').optional(),
  notes: z.string().min(1, 'Notes cannot be empty').optional(),
});

export const CheckoutDTO = z.object({
  items: z.array(CheckoutItemDTO).min(1, 'Checkout must contain at least one item'),
  shift: z.string().refine(
    (val) => shiftsConfig.isValidShift(val),
    { message: `Invalid shift. Valid shifts: ${shiftsConfig.getValidShifts().filter((s: string) => s !== 'all').join(', ')}` }
  ),
});

export const CheckoutIdParamDTO = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error('ID must be a positive integer');
    }
    return num;
  }),
});

export type CheckoutRequest = z.infer<typeof CheckoutDTO> & { userId: number };
export type CheckoutRequestWithPickUpTime = Omit<CheckoutRequest, 'shift'> & { pickUpTime: string };



