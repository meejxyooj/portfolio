import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/lib/constants';

interface StreakBadgeProps {
  streak: number;
  label: string;
  color?: string;
}

export function StreakBadge({ streak, label, color = colors.primary }: StreakBadgeProps) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.count, { color }]}>{streak}</Text>
      <Text style={styles.unit}>🔥</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 2 },
  count: { ...typography.h1, lineHeight: 32 },
  unit: { fontSize: 18 },
  label: { ...typography.caption, color: colors.textMuted },
});
