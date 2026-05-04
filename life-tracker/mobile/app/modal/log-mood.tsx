import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateJournalEntry } from '@/hooks/useJournal';
import { colors, spacing, typography } from '@/lib/constants';

const MOOD_EMOJI: Record<number, string> = {
  1: '😩', 2: '😞', 3: '😟', 4: '😐', 5: '😕',
  6: '🙂', 7: '😊', 8: '😄', 9: '😁', 10: '🤩',
};

const TAGS = ['exercise', 'social', 'work', 'rest', 'nature', 'creative', 'stress', 'sick', 'travel', 'family'];

function ScoreSlider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <View style={styles.sliderWrap}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.sliderValue, { color }]}>{value}/10</Text>
      </View>
      <View style={styles.sliderDots}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.dot, n <= value && { backgroundColor: color }]}
            onPress={() => onChange(n)}
          />
        ))}
      </View>
    </View>
  );
}

export default function LogMoodModal() {
  const router = useRouter();
  const createEntry = useCreateJournalEntry();

  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [stress, setStress] = useState(3);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSave() {
    await createEntry.mutateAsync({
      mood_score: mood,
      energy_score: energy,
      stress_score: stress,
      notes: notes.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.emojiHero}>{MOOD_EMOJI[mood]}</Text>

      <ScoreSlider label="Mood" value={mood} onChange={setMood} color={colors.rose} />
      <ScoreSlider label="Energy" value={energy} onChange={setEnergy} color={colors.amber} />
      <ScoreSlider label="Stress" value={stress} onChange={setStress} color={colors.violet} />

      <Text style={styles.label}>Tags</Text>
      <View style={styles.tagGrid}>
        {TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
            onPress={() => toggleTag(tag)}
          >
            <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="What's on your mind today?"
        placeholderTextColor={colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.saveBtn, createEntry.isPending && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={createEntry.isPending}
      >
        {createEntry.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save Entry</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  emojiHero: { fontSize: 64, textAlign: 'center', marginVertical: spacing.sm },
  label: { ...typography.bodySemibold, color: colors.textMuted },
  sliderWrap: { gap: spacing.sm },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { ...typography.bodySemibold, color: colors.text },
  sliderValue: { ...typography.bodySemibold },
  sliderDots: { flexDirection: 'row', gap: spacing.xs },
  dot: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagActive: { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
  tagText: { ...typography.body, color: colors.textMuted },
  tagTextActive: { color: colors.primary },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    height: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.bodySemibold, color: '#fff', fontSize: 16 },
});
