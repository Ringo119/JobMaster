import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobRepository } from '../data/repositories';
import type { Job } from '../data/models/job';
import type { JobFilter, NewJob } from '../data/repositories/types';

const KEY = ['jobs'];

export function useJobs(filter?: JobFilter) {
  return useQuery({
    queryKey: [...KEY, filter ?? {}],
    queryFn: () => jobRepository.list(filter),
  });
}

export function useJobsByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'client', clientId],
    queryFn: () => jobRepository.listByClient(clientId!),
    enabled: !!clientId,
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => jobRepository.get(id!),
    enabled: !!id,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewJob) => jobRepository.create(data),
    // Invalidating jobs updates the Job Register, Planner and Dashboard at once.
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Job> }) =>
      jobRepository.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
