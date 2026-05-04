import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HomeIdeaPreview } from '../data/mockIdeas';
import { theme } from '../theme/theme';

type IdeaPreviewCardProps = {
  idea: HomeIdeaPreview;
  onPress: () => void;
};

export function IdeaPreviewCard({ idea, onPress }: IdeaPreviewCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: idea.color },
        pressed ? styles.cardPressed : null,
      ]}
    >
      <Text style={styles.body} numberOfLines={3}>
        {idea.body}
      </Text>

      <View style={styles.tagsRow}>
        {idea.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.time}>{idea.createdAt}</Text>
        <View style={styles.impact}>
          <Ionicons name="sparkles" size={13} color={theme.colors.primary} />
          <Text style={styles.impactText} numberOfLines={1}>
            {idea.impact}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 132,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
    shadowColor: '#C9795C',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  body: {
    color: theme.colors.ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: theme.spacing.md,
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
  },
  tagText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  time: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  impact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  impactText: {
    color: theme.colors.text,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
  },
});
