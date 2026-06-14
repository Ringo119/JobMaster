import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceRepository } from '../data/repositories';

const KEY = ['invoices'];
const JOBS_KEY = ['jobs'];

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

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => invoiceRepository.get(id!),
    enabled: !!id,
  });
}

export function useInvoiceByJob(jobId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'job', jobId],
    queryFn: () => invoiceRepository.getByJob(jobId!),
    enabled: !!jobId,
  });
}

/** Invalidate both invoices and jobs — creating/paying an invoice changes job status. */
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY });
  qc.invalidateQueries({ queryKey: JOBS_KEY });
}

export function useCreateInvoiceFromJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => invoiceRepository.createFromJob(jobId),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useMarkInvoiceSent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceRepository.markSent(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceRepository.markPaid(id),
    onSuccess: () => invalidateAll(qc),
  });
}
