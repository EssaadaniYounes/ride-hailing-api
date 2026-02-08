import { z } from 'zod';
import { Role } from '../../config/role.enum';

export const RegisterSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.nativeEnum(Role)
});

export const LoginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});

export type RegisterPayloadDto = z.infer<typeof RegisterSchema>;
export type LoginPayloadDto = z.infer<typeof LoginSchema>;
