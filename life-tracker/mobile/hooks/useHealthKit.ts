import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useSyncAppleHealth } from './useHealth';
import type { HealthMetric } from '@/types/health';

// react-native-health is only available after `expo prebuild` (not in Expo Go).
// We lazy-import it so the app doesn't crash in Expo Go during development.
let AppleHealthKit: any = null;
try {
  AppleHealthKit = require('react-native-health').default;
} catch {
  // Running in Expo Go or on Android — HealthKit unavailable
}

const PERMISSIONS = AppleHealthKit
  ? {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.StepCount,
          AppleHealthKit.Constants.Permissions.HeartRateVariabilitySDNN,
          AppleHealthKit.Constants.Permissions.RestingHeartRate,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        ],
        write: [],
      },
    }
  : null;

export function useHealthKitSync() {
  const sync = useSyncAppleHealth();

  const fetchAndSync = useCallback(async () => {
    if (!AppleHealthKit || Platform.OS !== 'ios') return;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    const options = { startDate: sevenDaysAgo.toISOString(), endDate: now.toISOString() };

    const metrics: Partial<HealthMetric>[] = [];

    await new Promise<void>((resolve) => {
      AppleHealthKit.getStepCount(options, (_: any, results: any[]) => {
        for (const r of results ?? []) {
          metrics.push({ metric_type: 'steps', value: r.value, unit: 'steps', source: 'apple_health', recorded_at: r.startDate });
        }
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      AppleHealthKit.getHeartRateVariabilitySamples(options, (_: any, results: any[]) => {
        for (const r of results ?? []) {
          metrics.push({ metric_type: 'hrv', value: Math.round(r.value * 1000), unit: 'ms', source: 'apple_health', recorded_at: r.startDate });
        }
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      AppleHealthKit.getRestingHeartRate(options, (_: any, results: any[]) => {
        for (const r of results ?? []) {
          metrics.push({ metric_type: 'resting_hr', value: r.value, unit: 'bpm', source: 'apple_health', recorded_at: r.startDate });
        }
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      AppleHealthKit.getSleepSamples(options, (_: any, results: any[]) => {
        // Aggregate sleep duration per night
        const nightMap: Record<string, number> = {};
        for (const r of results ?? []) {
          if (r.value === 'ASLEEP') {
            const date = r.startDate.slice(0, 10);
            const dur = (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 3600000;
            nightMap[date] = (nightMap[date] ?? 0) + dur;
          }
        }
        for (const [date, hours] of Object.entries(nightMap)) {
          metrics.push({ metric_type: 'sleep_hours', value: parseFloat(hours.toFixed(1)), unit: 'hours', source: 'apple_health', recorded_at: `${date}T08:00:00Z` });
        }
        resolve();
      });
    });

    if (metrics.length > 0) {
      sync.mutate(metrics);
    }
  }, [sync]);

  useEffect(() => {
    if (!AppleHealthKit || Platform.OS !== 'ios') return;

    AppleHealthKit.initHealthKit(PERMISSIONS, (err: any) => {
      if (!err) fetchAndSync();
    });
  }, [fetchAndSync]);

  return { fetchAndSync };
}
