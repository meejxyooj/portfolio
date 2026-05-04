import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/lib/api';
import type { HealthMetric, HealthSummary } from '@/types/health';

export function useHealthSummary() {
  return useQuery<HealthSummary>({
    queryKey: ['health', 'summary'],
    queryFn: () => api.get('/health/summary').then((r) => r.data),
  });
}

export function useHealthMetrics(metricType: string, days: number) {
  return useQuery<HealthMetric[]>({
    queryKey: ['health', 'metrics', metricType, days],
    queryFn: () =>
      api
        .get('/health/metrics', {
          params: {
            type: metricType,
            from: new Date(Date.now() - days * 86400000).toISOString(),
            to: new Date().toISOString(),
          },
        })
        .then((r) => r.data),
  });
}

export function useSyncAppleHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (metrics: Partial<HealthMetric>[]) =>
      api.post('/health/metrics/bulk', { metrics }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health'] });
    },
  });
}

export function useAppleHealthSync() {
  const syncMutation = useSyncAppleHealth();

  useEffect(() => {
    // Actual HealthKit reads happen via react-native-health in a native module.
    // This hook is the integration point — call syncMutation.mutate(metrics)
    // after reading from HealthKit in the useHealthKit hook.
  }, []);

  return syncMutation;
}
