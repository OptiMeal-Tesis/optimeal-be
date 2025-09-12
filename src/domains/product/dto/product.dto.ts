import { z } from 'zod';
import { ProductTypeEnum, RestrictionEnum } from '@prisma/client';

// DTO for creating product (handles both JSON and form-data)
export const CreateProductInputDTO = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
    price: z.union([
        z.number().int().positive('Price must be a positive integer'),
        z.string().transform((val) => {
            const num = parseInt(val);
            if (isNaN(num) || num <= 0) {
                throw new Error('Price must be a positive integer');
            }
            return num;
        })
    ]),
    restrictions: z.union([
        z.array(z.nativeEnum(RestrictionEnum)).default([]),
        z.string().transform((val) => {
            if (!val) return [];
            try {
                return JSON.parse(val);
            } catch {
                return val.split(',').map(r => r.trim());
            }
        }).default('[]')
    ]),
    sides: z.union([
        z.array(z.number().int().positive('Side ID must be a positive integer')).default([]),
        z.string().transform((val) => {
            if (!val) return [];
            try {
                const parsed = JSON.parse(val);
                return Array.isArray(parsed) ? parsed.map(id => Number(id)) : [];
            } catch {
                return val.split(',').map(s => Number(s.trim())).filter(id => !isNaN(id));
            }
        }).default(() => [])
    ]),
    admitsClarifications: z.union([
        z.boolean().default(false),
        z.string().default('false').transform((val) => val === 'true')
    ]),
    type: z.nativeEnum(ProductTypeEnum, {
        message: 'Type must be FOOD or BEVERAGE'
    }),
    stock: z.union([
        z.number().int().min(0, 'Stock must be a non-negative integer').default(0),
        z.string().default('0').transform((val) => {
            const num = parseInt(val);
            if (isNaN(num) || num < 0) {
                throw new Error('Stock must be a non-negative integer');
            }
            return num;
        })
    ])
});

export const UpdateProductInputDTO = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters').optional(),
    price: z.union([
        z.number().int().positive('Price must be a positive integer'),
        z.string().transform((val) => {
            const num = parseInt(val);
            if (isNaN(num) || num <= 0) {
                throw new Error('Price must be a positive integer');
            }
            return num;
        })
    ]).optional(),
    photo: z.string().url('Photo must be a valid URL').or(z.literal('')).optional(),
    restrictions: z.union([
        z.array(z.nativeEnum(RestrictionEnum)),
        z.string().transform((val) => {
            if (!val) return [] as RestrictionEnum[];
            try {
                return JSON.parse(val);
            } catch {
                return val.split(',').map(r => r.trim()) as unknown as RestrictionEnum[];
            }
        })
    ]).optional(),
    sides: z.union([
        z.array(z.number().int().positive('Side ID must be a positive integer')),
        z.string().transform((val) => {
            if (!val) return [] as number[];
            try {
                const parsed = JSON.parse(val);
                return Array.isArray(parsed) ? parsed.map(id => Number(id)) : [];
            } catch {
                return val.split(',').map(s => Number(s.trim())).filter(id => !isNaN(id));
            }
        })
    ]).optional(),
    admitsClarifications: z.union([
        z.boolean(),
        z.string().transform((val) => val === 'true')
    ]).optional(),
    type: z.nativeEnum(ProductTypeEnum, {
        message: 'Type must be FOOD or BEVERAGE'
    }).optional(),
    stock: z.union([
        z.number().int().min(0, 'Stock must be a non-negative integer'),
        z.string().transform((val) => {
            const num = parseInt(val);
            if (isNaN(num) || num < 0) {
                throw new Error('Stock must be a non-negative integer');
            }
            return num;
        })
    ]).optional()
});

export const ProductIdParamDTO = z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number)
});

export type CreateProductInputDTO = z.infer<typeof CreateProductInputDTO>;
export type UpdateProductInputDTO = z.infer<typeof UpdateProductInputDTO>;
export type ProductIdParamDTO = z.infer<typeof ProductIdParamDTO>;
