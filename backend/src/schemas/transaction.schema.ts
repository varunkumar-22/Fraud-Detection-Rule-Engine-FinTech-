import { z } from 'zod';

export const transactionInputSchema = z.object({
  user_id:          z.string().uuid({ message: 'user_id must be a valid UUID' }),
  amount:           z.number().positive({ message: 'amount must be greater than 0' }),
  location:         z.string().min(1, { message: 'location is required' }),
  device_id:        z.string().min(1, { message: 'device_id is required' }),
  transaction_time: z.string().datetime({ message: 'transaction_time must be an ISO 8601 datetime' }).optional(),
  is_simulation:    z.boolean().optional().default(false),
});

export type TransactionInputDTO = z.infer<typeof transactionInputSchema>;
