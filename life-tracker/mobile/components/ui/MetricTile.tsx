import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/lib/constants';

interface MetricTileProps {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

export function MetricTile({ label, value, icon, color }: MetricTileProps) {
  return (
    <View style={[styles.tile, { borderColor: `${color}40` }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  value: { ...typography.bodySemibold, fontSize: 14 },
  label: { ...typography.caption, color: colors.textMuted },
});
