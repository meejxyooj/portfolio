import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { MetricTile } from '@/components/ui/MetricTile';
import { Card } from '@/components/ui/Card';
import { HabitCard } from '@/components/habits/HabitCard';
import { useHabitSummary, useCompleteHabit } from '@/hooks/useHabits';
import { useLatestJournal } from '@/hooks/useJournal';
import { useHealthSummary } from '@/hooks/useHealth';
import { colors, spacing, typography } from '@/lib/constants';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function DashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: habitSummary } = useHabitSummary();
  const { data: journal } = useLatestJournal();
  const { data: health } = useHealthSummary();
  const completeHabit = useCompleteHabit();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  const completedCount = habitSummary?.filter((h) => h.completed_today).length ?? 0;
  const totalCount = habitSummary?.length ?? 0;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.date}>{todayLabel()}</Text>
        </View>
        <TouchableOpacity style={styles.logBtn} onPress={() => router.push('/modal/log-mood')}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Metric row */}
      <View style={styles.metricRow}>
        <MetricTile
          label="Steps"
          value={health?.steps?.toLocaleString() ?? '—'}
          icon="footsteps-outline"
          color={colors.teal}
        />
        <MetricTile
          label="HRV"
          value={health?.hrv ? `${health.hrv} ms` : '—'}
          icon="pulse-outline"
          color={colors.violet}
        />
        <MetricTile
          label="Sleep"
          value={health?.sleep_hours ? `${health.sleep_hours}h` : '—'}
          icon="moon-outline"
          color={colors.indigo}
        />
        <MetricTile
          label="Mood"
          value={journal?.mood_score ? `${journal.mood_score}/10` : '—'}
          icon="heart-outline"
          color={colors.rose}
        />
      </View>

      {/* Habits today */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Habits</Text>
          <Text style={styles.sectionBadge}>{completedCount}/{totalCount} · {completionPct}%</Text>
        </View>
        {(habitSummary ?? []).length === 0 ? (
          <TouchableOpacity style={styles.emptyRow} onPress={() => router.push('/modal/add-habit')}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.emptyText}>Add your first habit</Text>
          </TouchableOpacity>
        ) : (
          (habitSummary ?? []).slice(0, 5).map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={() => completeHabit.mutate({ habitId: habit.id, completed: !habit.completed_today })}
            />
          ))
        )}
        {(habitSummary ?? []).length > 5 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/habits')}>
            <Text style={styles.seeAll}>See all habits →</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Quick mood log prompt if no entry today */}
      {!journal && (
        <TouchableOpacity style={styles.moodPrompt} onPress={() => router.push('/modal/log-mood')}>
          <Ionicons name="sunny-outline" size={20} color={colors.amber} />
          <Text style={styles.moodPromptText}>How are you feeling today?</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: 60, gap: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  greeting: { ...typography.h2, color: colors.text },
  date: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  logBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.h3, color: colors.text },
  sectionBadge: { ...typography.caption, color: colors.textMuted },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  emptyText: { ...typography.body, color: colors.primary },
  seeAll: { ...typography.caption, color: colors.primary, textAlign: 'center', marginTop: spacing.xs },
  moodPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodPromptText: { ...typography.body, color: colors.text, flex: 1 },
});
