import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { HabitWithStatus, HabitStreak, Habit } from '@/types/habit';

export function useHabitSummary() {
  return useQuery<HabitWithStatus[]>({
    queryKey: ['habits', 'summary'],
    queryFn: () => api.get('/habits/summary').then((r) => r.data),
  });
}

export function useHabitStreak(habitId: string | null) {
  return useQuery<HabitStreak>({
    queryKey: ['habits', habitId, 'streak'],
    queryFn: () => api.get(`/habits/${habitId}/streak`).then((r) => r.data),
    enabled: !!habitId,
  });
}

export function useCompleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, completed }: { habitId: string; completed: boolean }) =>
      completed
        ? api.post(`/habits/${habitId}/complete`)
        : api.delete(`/habits/${habitId}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Habit>) => api.post('/habits', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) => api.delete(`/habits/${habitId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
