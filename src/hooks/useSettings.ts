import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsRepository } from '../data/repositories';
import type { Settings } from '../data/models/settings';

const KEY = ['settings'];

export function useSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => settingsRepository.get(),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Settings>) => settingsRepository.update(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
