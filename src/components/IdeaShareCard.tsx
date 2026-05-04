import { Image, StyleSheet, Text, View } from 'react-native';

import type { AppSettings, Idea, Tag } from '../domain/models';
import { theme } from '../theme/theme';
import { formatDateTime } from '../utils/formatDate';
import { TagChip } from './TagChip';

type IdeaShareCardProps = {
  idea: Idea;
  tags: Tag[];
  settings: AppSettings;
};

export function IdeaShareCard({ idea, tags, settings }: IdeaShareCardProps) {
  return (
    <View style={styles.canvas} collapsable={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>灵感卡片</Text>
          <Text style={styles.brand}>Pieces 灵感糖罐</Text>
        </View>
        <View style={styles.logoSlot}>
          {settings.logoUri ? (
            <Image source={{ uri: settings.logoUri }} style={styles.logoImage} />
          ) : (
            <Text style={styles.logoText}>IP</Text>
          )}
        </View>
      </View>

      {idea.imageUri ? <Image source={{ uri: idea.imageUri }} style={styles.ideaImage} /> : null}

      <Text style={styles.content}>{idea.content}</Text>

      <View style={styles.tagsRow}>
        {tags.length > 0 ? tags.map((tag) => <TagChip key={tag.id} tag={tag} />) : null}
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>记录于</Text>
          <Text style={styles.footerText}>{formatDateTime(idea.created_at)}</Text>
        </View>
        <View style={styles.signature}>
          <Text style={styles.footerLabel}>来自</Text>
          <Text style={styles.footerText}>{settings.userName}</Text>
        </View>
      </View>

      <Text style={styles.slogan}>把闪过的想法，温柔地变成作品。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: 320,
    minHeight: 460,
    alignSelf: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: 28,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#C9795C',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  brand: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  logoSlot: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
  },
  logoText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  ideaImage: {
    width: '100%',
    height: 150,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.blueSoft,
  },
  content: {
    color: theme.colors.ink,
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '900',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  footerText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  signature: {
    alignItems: 'flex-end',
  },
  slogan: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    backgroundColor: theme.colors.greenSoft,
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
});
