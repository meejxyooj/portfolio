export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  target_count: number;
  color?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
}

export interface HabitWithStatus extends Habit {
  completed_today: boolean;
  current_streak: number;
}

export interface HabitStreak {
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  completion_rate_30d: number;
  history: Array<{ date: string; completed: boolean }>;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  notes?: string;
}
