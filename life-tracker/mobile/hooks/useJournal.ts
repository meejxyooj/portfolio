import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { JournalEntry } from '@/types/health';

export function useJournalEntries(days = 30) {
  return useQuery<JournalEntry[]>({
    queryKey: ['journal', days],
    queryFn: () => api.get('/journal', { params: { days } }).then((r) => r.data),
  });
}

export function useLatestJournal() {
  return useQuery<JournalEntry | null>({
    queryKey: ['journal', 'latest'],
    queryFn: () => api.get('/journal', { params: { limit: 1 } }).then((r) => r.data[0] ?? null),
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<JournalEntry>) => api.post('/journal', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}
