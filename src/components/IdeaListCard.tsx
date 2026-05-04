import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Idea } from '../domain/models';
import type { Tag } from '../domain/models';
import { theme } from '../theme/theme';
import { formatDateTime } from '../utils/formatDate';
import type { IdeaImpact } from '../utils/impact';
import { TagChip } from './TagChip';

type IdeaListCardProps = {
  idea: Idea;
  tags?: Tag[];
  impact?: IdeaImpact;
  onPress: () => void;
};

export function IdeaListCard({ idea, tags = [], impact, onPress }: IdeaListCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <Text style={styles.content} numberOfLines={4}>
        {idea.content}
      </Text>

      <View style={styles.tagsRow}>
        {tags.length > 0 ? (
          tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))
        ) : (
          <Text style={styles.noTag}>未添加标签</Text>
        )}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.time}>{formatDateTime(idea.created_at)}</Text>
        <View style={styles.impact}>
          <Ionicons name="git-branch-outline" size={14} color={theme.colors.primary} />
          <Text style={styles.impactText}>
            {impact ? `${impact.usedCount} 项目 · ${impact.completedOutcomeCount} 成果` : `${idea.relatedIdeaIds.length} 个关联`}
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#C9795C',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  content: {
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
  noTag: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  time: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  impact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  impactText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
});
