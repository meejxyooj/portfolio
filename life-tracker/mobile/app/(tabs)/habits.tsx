import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { HabitCard } from '@/components/habits/HabitCard';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { TrendLine } from '@/components/charts/TrendLine';
import { Card } from '@/components/ui/Card';
import { useHabitSummary, useCompleteHabit, useDeleteHabit, useHabitStreak } from '@/hooks/useHabits';
import { colors, spacing, typography } from '@/lib/constants';
import type { HabitWithStatus } from '@/types/habit';

export default function HabitsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const { data: habits, isLoading } = useHabitSummary();
  const completeHabit = useCompleteHabit();
  const deleteHabit = useDeleteHabit();
  const { data: streak } = useHabitStreak(selectedHabitId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['habits'] });
    setRefreshing(false);
  }, [queryClient]);

  function confirmDelete(habit: HabitWithStatus) {
    Alert.alert(
      `Delete "${habit.name}"?`,
      'This will remove the habit and all its history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteHabit.mutate(habit.id),
        },
      ],
    );
  }

  const completedToday = (habits ?? []).filter((h) => h.completed_today).length;
  const total = (habits ?? []).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Habits</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/modal/add-habit')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Daily progress banner */}
      {total > 0 && (
        <Card style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              <Text style={styles.progressCount}>{completedToday}</Text>/{total} completed today
            </Text>
            <Text style={styles.progressPct}>
              {Math.round((completedToday / total) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(completedToday / total) * 100}%` as any }]} />
          </View>
        </Card>
      )}

      {/* Habit list */}
      {isLoading ? (
        <Text style={styles.loadingText}>Loading habits...</Text>
      ) : (habits ?? []).length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Text style={styles.emptySubtitle}>Build consistency by tracking daily habits</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/modal/add-habit')}>
            <Text style={styles.emptyBtnText}>Add Your First Habit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.habitList}>
          {(habits ?? []).map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={() =>
                completeHabit.mutate({ habitId: habit.id, completed: !habit.completed_today })
              }
              onPress={() => setSelectedHabitId(selectedHabitId === habit.id ? null : habit.id)}
              onDelete={() => confirmDelete(habit)}
              expanded={selectedHabitId === habit.id}
            />
          ))}
        </View>
      )}

      {/* Streak detail for selected habit */}
      {selectedHabitId && streak && (
        <Card style={styles.streakCard}>
          <View style={styles.streakRow}>
            <StreakBadge streak={streak.current_streak} label="Current" />
            <StreakBadge streak={streak.longest_streak} label="Best" color={colors.amber} />
            <View style={styles.streakStat}>
              <Text style={styles.streakStatValue}>{streak.completion_rate_30d}%</Text>
              <Text style={styles.streakStatLabel}>30-day rate</Text>
            </View>
          </View>
          {streak.history && streak.history.length > 0 && (
            <TrendLine
              data={streak.history.map((d) => ({ x: d.date, y: d.completed ? 1 : 0 }))}
              color={colors.primary}
              height={60}
            />
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: 60, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h1, color: colors.text },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: { gap: spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { ...typography.body, color: colors.textMuted },
  progressCount: { ...typography.bodySemibold, color: colors.text },
  progressPct: { ...typography.h3, color: colors.primary },
  progressBarBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  loadingText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  habitList: { gap: spacing.sm },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...typography.h2, color: colors.text },
  emptySubtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  emptyBtnText: { ...typography.bodySemibold, color: '#fff' },
  streakCard: { gap: spacing.md },
  streakRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  streakStat: { alignItems: 'center', gap: 4 },
  streakStatValue: { ...typography.h2, color: colors.text },
  streakStatLabel: { ...typography.caption, color: colors.textMuted },
});
