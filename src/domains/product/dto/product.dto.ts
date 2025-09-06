import { z } from 'zod';
import { ProductTypeEnum, RestrictionEnum } from '@prisma/client';

export const CreateProductInputDTO = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
    price: z.number().int().positive('Price must be a positive integer'),
    photo: z.string().url('Photo must be a valid URL').or(z.literal('')).optional(),
    restrictions: z.array(z.nativeEnum(RestrictionEnum)).default([]),
    sides: z.array(z.string()).default([]),
    admitsClarifications: z.boolean().default(false),
    type: z.nativeEnum(ProductTypeEnum, {
        message: 'Type must be FOOD or BEVERAGE'
    }),
    stock: z.number().int().min(0, 'Stock must be a non-negative integer').default(0)
});

export const UpdateProductInputDTO = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters').optional(),
    price: z.number().int().positive('Price must be a positive integer').optional(),
    photo: z.string().url('Photo must be a valid URL').or(z.literal('')).optional(),
    restrictions: z.array(z.nativeEnum(RestrictionEnum)).optional(),
    sides: z.array(z.string()).optional(),
    admitsClarifications: z.boolean().optional(),
    type: z.nativeEnum(ProductTypeEnum, {
        message: 'Type must be FOOD or BEVERAGE'
    }).optional(),
    stock: z.number().int().min(0, 'Stock must be a non-negative integer').optional()
});

export const ProductIdParamDTO = z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number)
});

export type CreateProductInputDTO = z.infer<typeof CreateProductInputDTO>;
export type UpdateProductInputDTO = z.infer<typeof UpdateProductInputDTO>;
export type ProductIdParamDTO = z.infer<typeof ProductIdParamDTO>;
