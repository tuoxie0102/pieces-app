import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CreativeProject, Outcome } from '../domain/models';
import { theme } from '../theme/theme';
import { formatDateTime } from '../utils/formatDate';

type OutcomeCardProps = {
  outcome: Outcome;
  project?: CreativeProject;
  ideaCount: number;
  onPress: () => void;
};

export function OutcomeCard({ outcome, project, ideaCount, onPress }: OutcomeCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={2}>
          {project?.title ?? '未命名成果'}
        </Text>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{outcome.type}</Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={3}>
        {outcome.resultDescription}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="sparkles-outline" size={14} color={theme.colors.primary} />
          <Text style={styles.metaText}>{ideaCount} 条来源灵感</Text>
        </View>
        <Text style={styles.time}>{formatDateTime(outcome.completed_at)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#C9795C',
    shadowOpacity: 0.11,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    color: theme.colors.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.blueSoft,
  },
  typeText: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  description: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  time: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
