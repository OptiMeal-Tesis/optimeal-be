import { z } from 'zod';

// Signup DTO validation schema
export const SignupInputDTO = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    national_id: z.string().regex(/^\d{7,10}$/, 'National ID must be 7-10 digits'),
});

// Login DTO validation schema
export const LoginInputDTO = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// Confirm signup DTO validation schema
export const ConfirmSignupInputDTO = z.object({
    email: z.string().email('Invalid email format'),
    confirmationCode: z.string().length(6, 'Confirmation code must be 6 digits'),
});

// Type exports
export type SignupInputDTO = z.infer<typeof SignupInputDTO>;
export type LoginInputDTO = z.infer<typeof LoginInputDTO>;
export type ConfirmSignupInputDTO = z.infer<typeof ConfirmSignupInputDTO>;
