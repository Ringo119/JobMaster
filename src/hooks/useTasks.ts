import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskRepository } from '../data/repositories';
import type { JobTask } from '../data/models/task';
import type { NewTask } from '../data/repositories/types';

const KEY = ['tasks'];

/** All tasks across every job — the Planner groups them by job itself. */
export function useTasks() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => taskRepository.list(),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewTask) => taskRepository.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<JobTask> }) =>
      taskRepository.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskRepository.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Shift a job's whole task plan by N days — used when its bar is dragged. */
export function useShiftJobTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, deltaDays }: { jobId: string; deltaDays: number }) =>
      taskRepository.shiftByJob(jobId, deltaDays),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
