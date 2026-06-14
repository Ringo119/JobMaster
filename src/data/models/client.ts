import { z } from 'zod';

export const clientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Client name is required'),
  contact: z.string().optional(),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  /** Default payment terms in days (e.g. 14 / 30). Used by the Phase 2 payments screen. */
  paymentTermsDays: z.number().int().nonnegative().optional(),
  createdAt: z.string(),
});

export type Client = z.infer<typeof clientSchema>;

/** Fields editable in the client form (everything except generated id/createdAt). */
export const clientFormSchema = clientSchema.omit({ id: true, createdAt: true });
export type ClientFormValues = z.infer<typeof clientFormSchema>;
