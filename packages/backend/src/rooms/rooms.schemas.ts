import { z } from 'zod';
export const getRoomByIdSchema = z.string().min(1);
