import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { TrendLine } from '@/components/charts/TrendLine';
import { useJournalEntries } from '@/hooks/useJournal';
import { colors, spacing, typography } from '@/lib/constants';
import type { JournalEntry } from '@/types/health';

const MOOD_EMOJI: Record<number, string> = {
  1: '😩', 2: '😞', 3: '😟', 4: '😐', 5: '😕',
  6: '🙂', 7: '😊', 8: '😄', 9: '😁', 10: '🤩',
};

function moodColor(score: number): string {
  if (score <= 3) return colors.rose;
  if (score <= 5) return colors.amber;
  if (score <= 7) return colors.teal;
  return colors.primary;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function JournalEntryRow({ entry }: { entry: JournalEntry }) {
  return (
    <Card style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryDate}>{formatDate(entry.recorded_at)}</Text>
        <View style={styles.entryScores}>
          <Text style={[styles.moodEmoji]}>{MOOD_EMOJI[entry.mood_score] ?? '—'}</Text>
        </View>
      </View>
      <View style={styles.scoreRow}>
        <ScorePill label="Mood" value={entry.mood_score} color={moodColor(entry.mood_score)} />
        <ScorePill label="Energy" value={entry.energy_score} color={colors.amber} />
        <ScorePill label="Stress" value={entry.stress_score} color={colors.rose} />
      </View>
      {!!entry.notes && <Text style={styles.entryNotes}>{entry.notes}</Text>}
      {entry.tags && entry.tags.length > 0 && (
        <View style={styles.tagRow}>
          {entry.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.scorePill}>
      <View style={[styles.scoreDot, { backgroundColor: color }]} />
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={[styles.scoreValue, { color }]}>{value}/10</Text>
    </View>
  );
}

export default function JournalScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: entries, isLoading } = useJournalEntries(30);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['journal'] });
    setRefreshing(false);
  }, [queryClient]);

  const moodTrend = (entries ?? [])
    .slice()
    .reverse()
    .map((e) => ({ x: e.recorded_at, y: e.mood_score }));

  const avgMood =
    (entries ?? []).length > 0
      ? ((entries ?? []).reduce((s, e) => s + e.mood_score, 0) / (entries ?? []).length).toFixed(1)
      : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/modal/log-mood')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 30-day mood trend */}
      {moodTrend.length > 1 && (
        <Card style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendTitle}>30-Day Mood</Text>
            {avgMood && <Text style={styles.trendAvg}>avg {avgMood}/10</Text>}
          </View>
          <TrendLine data={moodTrend} color={colors.rose} height={80} yDomain={[1, 10]} />
        </Card>
      )}

      {/* Entry list */}
      {isLoading ? (
        <Text style={styles.loadingText}>Loading entries...</Text>
      ) : (entries ?? []).length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📓</Text>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptySubtitle}>Track your mood and energy daily</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/modal/log-mood')}>
            <Text style={styles.emptyBtnText}>Log Today's Entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        (entries ?? []).map((entry) => <JournalEntryRow key={entry.id} entry={entry} />)
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
  trendCard: { gap: spacing.sm },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendTitle: { ...typography.bodySemibold, color: colors.text },
  trendAvg: { ...typography.caption, color: colors.textMuted },
  loadingText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
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
  entryCard: { gap: spacing.sm },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryDate: { ...typography.bodySemibold, color: colors.text },
  entryScores: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  moodEmoji: { fontSize: 22 },
  scoreRow: { flexDirection: 'row', gap: spacing.sm },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreDot: { width: 6, height: 6, borderRadius: 3 },
  scoreLabel: { ...typography.caption, color: colors.textMuted },
  scoreValue: { ...typography.caption },
  entryNotes: { ...typography.body, color: colors.textSecondary, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: { ...typography.caption, color: colors.primary },
});
