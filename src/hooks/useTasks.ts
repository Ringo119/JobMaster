import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskRepository } from '../data/repositories';
import type { JobTask } from '../data/models/task';
import type { NewTask } from '../data/repositories/types';

const KEY = ['tasks'];

/** All tasks across all jobs — the Planner groups these by jobId. */
export function useAllTasks() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => taskRepository.listAll(),
  });
}

export function useTasksByJob(jobId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'job', jobId],
    queryFn: () => taskRepository.listByJob(jobId!),
    enabled: !!jobId,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewTask) => taskRepository.create(data),
    // Invalidating the root key refreshes both the per-job list and the Planner.
    // Jobs are invalidated too: a task entering "doing" can advance the job's
    // status (planning → working) via the repository automation.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<JobTask> }) =>
      taskRepository.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useRemoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskRepository.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
