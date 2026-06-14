import { z } from 'zod';

export const SETTINGS_ID = 'app-settings';

export const settingsSchema = z.object({
  id: z.literal(SETTINGS_ID),
  businessName: z.string(),
  address: z.string(),
  vatNumber: z.string(),
  invoicePrefix: z.string(),
  /** Default VAT rate as a fraction (0.20 == 20%). */
  defaultVatRate: z.number().min(0).max(1),
  hourlyRatePence: z.number().int().nonnegative().optional(),
  logoDataUrl: z.string().optional(),
  /** Next sequential job number to assign. */
  nextJobNumber: z.number().int(),
  /** Next sequential invoice number within the year. */
  nextInvoiceSeq: z.number().int(),
});

export type Settings = z.infer<typeof settingsSchema>;

export const defaultSettings: Settings = {
  id: SETTINGS_ID,
  businessName: 'David — Quantity Surveyor',
  address: '',
  vatNumber: '',
  invoicePrefix: 'INV',
  defaultVatRate: 0.2,
  hourlyRatePence: undefined,
  logoDataUrl: undefined,
  nextJobNumber: 25017,
  nextInvoiceSeq: 18,
};
