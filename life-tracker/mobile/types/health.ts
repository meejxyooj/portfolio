export type MetricType =
  | 'steps'
  | 'hrv'
  | 'resting_hr'
  | 'sleep_hours'
  | 'sleep_score'
  | 'mood'
  | 'energy'
  | 'stress'
  | 'weight'
  | 'calories_burned'
  | 'spo2';

export type MetricSource = 'manual' | 'apple_health' | 'strava' | 'terra_oura' | 'terra_garmin' | 'terra_whoop';

export interface HealthMetric {
  id: string;
  user_id: string;
  metric_type: MetricType;
  value: number;
  unit?: string;
  source: MetricSource;
  recorded_at: string;
}

export interface HealthSummary {
  steps?: number;
  hrv?: number;
  resting_hr?: number;
  sleep_hours?: number;
  sleep_score?: number;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  mood_score: number;
  energy_score: number;
  stress_score: number;
  notes?: string;
  tags?: string[];
  recorded_at: string;
}
