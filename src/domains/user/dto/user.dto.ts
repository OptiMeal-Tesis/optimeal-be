import { z } from 'zod';
import { UserTypeEnum } from '@prisma/client';

// Create user DTO validation schema
export const CreateUserInputDTO = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    national_id: z.string().regex(/^\d{7,10}$/, 'National ID must be 7-10 digits'),
    role: z.nativeEnum(UserTypeEnum).optional().default(UserTypeEnum.USER),
    cognito_sub: z.string().optional(),
});

// Update user DTO validation schema
export const UpdateUserInputDTO = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    national_id: z.string().regex(/^\d{7,10}$/, 'National ID must be 7-10 digits').optional(),
    role: z.nativeEnum(UserTypeEnum).optional(),
});

// Get user by ID DTO validation schema
export const GetUserByIdInputDTO = z.object({
    id: z.number().int().positive('User ID must be a positive integer'),
});

// Get user by email DTO validation schema
export const GetUserByEmailInputDTO = z.object({
    email: z.string().email('Invalid email format'),
});

// Get user by national ID DTO validation schema
export const GetUserByNationalIdInputDTO = z.object({
    national_id: z.string().regex(/^\d{7,10}$/, 'National ID must be 7-10 digits'),
});

// Type exports
export type CreateUserInputDTO = z.infer<typeof CreateUserInputDTO>;
export type UpdateUserInputDTO = z.infer<typeof UpdateUserInputDTO>;
export type GetUserByIdInputDTO = z.infer<typeof GetUserByIdInputDTO>;
export type GetUserByEmailInputDTO = z.infer<typeof GetUserByEmailInputDTO>;
export type GetUserByNationalIdInputDTO = z.infer<typeof GetUserByNationalIdInputDTO>;
