import { z } from 'zod';

export const SideIdParamDTO = z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number)
});

export type SideIdParamDTO = z.infer<typeof SideIdParamDTO>;

export const CreateSideInputDTO = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    isActive: z.union([
        z.boolean().default(true),
        z.string().default('true').transform((val) => val === 'true')
    ])
});

export type CreateSideInputDTO = z.infer<typeof CreateSideInputDTO>;

export const UpdateSideActiveInputDTO = z.object({
    isActive: z.union([
        z.boolean(),
        z.string().transform((val) => val === 'true')
    ])
});

export type UpdateSideActiveInputDTO = z.infer<typeof UpdateSideActiveInputDTO>;

