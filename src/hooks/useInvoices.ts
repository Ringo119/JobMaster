import { useQuery } from '@tanstack/react-query';
import { invoiceRepository } from '../data/repositories';

const KEY = ['invoices'];

// Read-only in Phase 1; the generator arrives in Phase 2.
export function useInvoices() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => invoiceRepository.list(),
  });
}

export function useInvoicesByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'client', clientId],
    queryFn: () => invoiceRepository.listByClient(clientId!),
    enabled: !!clientId,
  });
}
