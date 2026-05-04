import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { TrendLine } from '@/components/charts/TrendLine';
import { useHealthMetrics, useHealthSummary } from '@/hooks/useHealth';
import { colors, spacing, typography } from '@/lib/constants';

type Window = '7d' | '30d' | '90d';

const WINDOWS: Window[] = ['7d', '30d', '90d'];

function WindowPicker({ value, onChange }: { value: Window; onChange: (w: Window) => void }) {
  return (
    <View style={styles.windowPicker}>
      {WINDOWS.map((w) => (
        <TouchableOpacity
          key={w}
          style={[styles.windowBtn, value === w && styles.windowBtnActive]}
          onPress={() => onChange(w)}
        >
          <Text style={[styles.windowBtnText, value === w && styles.windowBtnTextActive]}>{w}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MetricSection({
  title,
  icon,
  color,
  metricType,
  unit,
  window,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  metricType: string;
  unit: string;
  window: Window;
}) {
  const days = window === '7d' ? 7 : window === '30d' ? 30 : 90;
  const { data } = useHealthMetrics(metricType, days);

  const chartData = (data ?? []).map((d) => ({ x: d.recorded_at, y: Number(d.value) }));
  const latest = chartData[chartData.length - 1]?.y;
  const avg =
    chartData.length > 0
      ? (chartData.reduce((s, d) => s + d.y, 0) / chartData.length).toFixed(1)
      : null;

  if (!data || data.length === 0) return null;

  return (
    <Card style={styles.metricSection}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconWrap, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.metricHeaderText}>
          <Text style={styles.metricTitle}>{title}</Text>
          {avg && <Text style={styles.metricAvg}>avg {avg} {unit}</Text>}
        </View>
        {latest !== undefined && (
          <Text style={[styles.metricLatest, { color }]}>
            {latest} <Text style={styles.metricUnit}>{unit}</Text>
          </Text>
        )}
      </View>
      <TrendLine data={chartData} color={color} height={72} />
    </Card>
  );
}

export default function HealthScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [window, setWindow] = useState<Window>('30d');
  const { data: summary } = useHealthSummary();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['health'] });
    setRefreshing(false);
  }, [queryClient]);

  const hasAnyData = summary && Object.values(summary).some(Boolean);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Health</Text>
        <WindowPicker value={window} onChange={setWindow} />
      </View>

      {!hasAnyData && (
        <Card style={styles.noDataCard}>
          <Ionicons name="heart-outline" size={32} color={colors.textMuted} />
          <Text style={styles.noDataTitle}>No health data yet</Text>
          <Text style={styles.noDataText}>
            Grant Apple Health permissions or add manual entries to see trends here.
          </Text>
        </Card>
      )}

      <MetricSection title="Steps" icon="footsteps-outline" color={colors.teal} metricType="steps" unit="steps" window={window} />
      <MetricSection title="HRV" icon="pulse-outline" color={colors.violet} metricType="hrv" unit="ms" window={window} />
      <MetricSection title="Resting Heart Rate" icon="heart-outline" color={colors.rose} metricType="resting_hr" unit="bpm" window={window} />
      <MetricSection title="Sleep" icon="moon-outline" color={colors.indigo} metricType="sleep_hours" unit="hrs" window={window} />
      <MetricSection title="Sleep Score" icon="star-outline" color={colors.amber} metricType="sleep_score" unit="/100" window={window} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: 60, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h1, color: colors.text },
  windowPicker: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  windowBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  windowBtnActive: { backgroundColor: colors.primary },
  windowBtnText: { ...typography.caption, color: colors.textMuted },
  windowBtnTextActive: { color: '#fff', fontWeight: '600' },
  noDataCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  noDataTitle: { ...typography.h3, color: colors.text },
  noDataText: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  metricSection: { gap: spacing.sm },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metricIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metricHeaderText: { flex: 1 },
  metricTitle: { ...typography.bodySemibold, color: colors.text },
  metricAvg: { ...typography.caption, color: colors.textMuted },
  metricLatest: { ...typography.h3 },
  metricUnit: { ...typography.caption, color: colors.textMuted },
});
