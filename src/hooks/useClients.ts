import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientRepository } from '../data/repositories';
import type { Client } from '../data/models/client';

const KEY = ['clients'];

export function useClients(search?: string) {
  return useQuery({
    queryKey: [...KEY, { search: search ?? '' }],
    queryFn: () => clientRepository.list(search),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => clientRepository.get(id!),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Client, 'id' | 'createdAt'>) => clientRepository.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Client> }) =>
      clientRepository.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
