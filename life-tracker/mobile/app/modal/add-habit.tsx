import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateHabit } from '@/hooks/useHabits';
import { colors, spacing, typography } from '@/lib/constants';

const PRESET_COLORS = [colors.primary, colors.teal, colors.rose, colors.amber, colors.violet, colors.indigo, colors.green];
const PRESET_ICONS = ['💧', '🏃', '📚', '🧘', '💊', '😴', '🥗', '🏋️', '✍️', '🎯', '🎸', '🧠'];

export default function AddHabitModal() {
  const router = useRouter();
  const createHabit = useCreateHabit();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [selectedColor, setSelectedColor] = useState(colors.primary);
  const [selectedIcon, setSelectedIcon] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for your habit.');
      return;
    }
    await createHabit.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      target_count: 1,
      color: selectedColor,
      icon: selectedIcon || undefined,
      is_active: true,
    });
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Habit Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Drink 2L of water"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
        autoFocus
        maxLength={60}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Why does this habit matter?"
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Frequency</Text>
      <View style={styles.freqRow}>
        {(['daily', 'weekly'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
            onPress={() => setFrequency(f)}
          >
            <Text style={[styles.freqBtnText, frequency === f && styles.freqBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Icon</Text>
      <View style={styles.iconGrid}>
        {PRESET_ICONS.map((icon) => (
          <TouchableOpacity
            key={icon}
            style={[styles.iconBtn, selectedIcon === icon && styles.iconBtnActive]}
            onPress={() => setSelectedIcon(icon === selectedIcon ? '' : icon)}
          >
            <Text style={styles.iconEmoji}>{icon}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Color</Text>
      <View style={styles.colorRow}>
        {PRESET_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
            onPress={() => setSelectedColor(c)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.createBtn, createHabit.isPending && styles.createBtnDisabled]}
        onPress={handleCreate}
        disabled={createHabit.isPending}
      >
        {createHabit.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createBtnText}>Create Habit</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  label: { ...typography.bodySemibold, color: colors.textMuted, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: { height: 80, textAlignVertical: 'top', paddingTop: 13 },
  freqRow: { flexDirection: 'row', gap: spacing.sm },
  freqBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  freqBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
  freqBtnText: { ...typography.bodySemibold, color: colors.textMuted },
  freqBtnTextActive: { color: colors.primary },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
  iconEmoji: { fontSize: 22 },
  colorRow: { flexDirection: 'row', gap: spacing.md },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { ...typography.bodySemibold, color: '#fff', fontSize: 16 },
});
