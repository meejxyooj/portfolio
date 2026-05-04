import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { colors, spacing, typography } from '@/lib/constants';
import type { HabitWithStatus } from '@/types/habit';

interface HabitCardProps {
  habit: HabitWithStatus;
  onToggle: () => void;
  onPress?: () => void;
  onDelete?: () => void;
  expanded?: boolean;
}

export function HabitCard({ habit, onToggle, onPress, onDelete, expanded }: HabitCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handleToggle() {
    scale.value = withSpring(0.94, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    onToggle();
  }

  const dotColor = habit.color ?? colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.card, habit.completed_today && styles.cardCompleted]}
    >
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />

        <View style={styles.info}>
          <Text style={[styles.name, habit.completed_today && styles.nameCompleted]}>
            {habit.icon ? `${habit.icon} ` : ''}{habit.name}
          </Text>
          {habit.current_streak > 0 && (
            <Text style={styles.streak}>🔥 {habit.current_streak} day streak</Text>
          )}
        </View>

        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            style={[styles.checkbox, habit.completed_today && { backgroundColor: dotColor, borderColor: dotColor }]}
            onPress={handleToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {habit.completed_today && <Ionicons name="checkmark" size={16} color="#fff" />}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {expanded && onDelete && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={16} color={colors.rose} />
            <Text style={styles.deleteBtnText}>Delete habit</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCompleted: { borderColor: `${colors.primary}40` },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  info: { flex: 1 },
  name: { ...typography.bodySemibold, color: colors.text },
  nameCompleted: { color: colors.textMuted },
  streak: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  deleteBtnText: { ...typography.caption, color: colors.rose },
});
