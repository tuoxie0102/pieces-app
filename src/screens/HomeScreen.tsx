import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CandyJarVisual } from '../components/CandyJarVisual';
import { IdeaListCard } from '../components/IdeaListCard';
import { MetricTile } from '../components/MetricTile';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { homeIdeaPreviews } from '../data/mockIdeas';
import type { CreativeProject, Idea, IdeaTag, Outcome, ProjectIdea, Tag } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { listIdeaTags } from '../storage/repositories/ideaTagRepository';
import { listIdeas } from '../storage/repositories/ideaRepository';
import { listOutcomes } from '../storage/repositories/outcomeRepository';
import { listProjectIdeas } from '../storage/repositories/projectIdeaRepository';
import { listProjects } from '../storage/repositories/projectRepository';
import { listTags } from '../storage/repositories/tagRepository';
import { theme } from '../theme/theme';
import { getIdeaImpact, getImpactInsight } from '../utils/impact';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ideaTags, setIdeaTags] = useState<IdeaTag[]>([]);
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.all([listIdeas(), listProjects(), listTags(), listIdeaTags(), listOutcomes(), listProjectIdeas()]).then(([nextIdeas, nextProjects, nextTags, nextIdeaTags, nextOutcomes, nextProjectIdeas]) => {
        if (!active) {
          return;
        }

        setIdeas(nextIdeas);
        setProjects(nextProjects);
        setTags(nextTags);
        setIdeaTags(nextIdeaTags);
        setOutcomes(nextOutcomes);
        setProjectIdeas(nextProjectIdeas);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const mockHomeTags: Tag[] = Array.from(
    new Map(
      homeIdeaPreviews.flatMap((idea) =>
        idea.tags.map((tagName) => [
          tagName,
          {
            id: `mock-tag-${tagName}`,
            name: tagName,
            color: idea.color,
            isFavorite: false,
            created_at: new Date(0).toISOString(),
          } satisfies Tag,
        ]),
      ),
    ).values(),
  );
  const mockHomeIdeas: Idea[] = homeIdeaPreviews.map((preview, index) => ({
    id: preview.id,
    content: preview.body,
    relatedIdeaIds: [],
    status: 'inbox',
    created_at: new Date(Date.now() - index * 86400000).toISOString(),
    updated_at: new Date(Date.now() - index * 86400000).toISOString(),
  }));
  const mockHomeIdeaTags: IdeaTag[] = homeIdeaPreviews.flatMap((preview) =>
    preview.tags.map((tagName) => ({
      idea_id: preview.id,
      tag_id: `mock-tag-${tagName}`,
    })),
  );
  const displayIdeas = ideas.length > 0 ? ideas : mockHomeIdeas;
  const displayTags = ideas.length > 0 ? tags : mockHomeTags;
  const displayIdeaTags = ideas.length > 0 ? ideaTags : mockHomeIdeaTags;
  const recentIdeas = displayIdeas.slice(0, 4);
  const getTagsForIdea = (ideaId: string) => {
    const tagIds = displayIdeaTags.filter((link) => link.idea_id === ideaId).map((link) => link.tag_id);
    return displayTags.filter((tag) => tagIds.includes(tag.id));
  };
  const getImpactForIdea = (ideaId: string) =>
    getIdeaImpact({ ideaId, projects, projectIdeas, outcomes });
  const insight = getImpactInsight({
    ideasLength: displayIdeas.length,
    projects,
    projectIdeas,
    outcomes,
  });
  const metrics = [
    { label: '当前灵感', value: String(displayIdeas.length), tone: 'primary' as const },
    { label: '创作项目', value: String(projects.length), tone: 'accent' as const },
    { label: '成果数', value: String(outcomes.length), tone: 'neutral' as const },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.greeting}>早安，创作者</Text>
          <Text style={styles.appName}>Pieces 灵感糖罐</Text>
        </View>
        <View style={styles.avatarSlot}>
          <Ionicons name="person" size={22} color={theme.colors.primary} />
        </View>
      </View>

      <View style={styles.heroIntro}>
        <Text style={styles.heroText}>最近冒出来的好点子，都先轻轻放在这里。</Text>
        <View style={styles.logoPill}>
          <Text style={styles.logoPillText}>IP / Logo</Text>
        </View>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>最近灵感</Text>
        <Text style={styles.sectionHint}>今天也在发光</Text>
      </View>

      <View style={styles.ideaStack}>
        {recentIdeas.map((idea) => (
          <IdeaListCard
            key={idea.id}
            idea={idea}
            tags={getTagsForIdea(idea.id)}
            impact={getImpactForIdea(idea.id)}
            onPress={() => {
              if (ideas.length > 0) {
                navigation.navigate('IdeaDetail', { ideaId: idea.id });
                return;
              }

              navigation.navigate('IdeaForm');
            }}
          />
        ))}
      </View>

      <View style={styles.metricsRow}>
        {metrics.map((metric) => (
          <MetricTile key={metric.label} {...metric} />
        ))}
      </View>

      <View style={styles.insightCard}>
        <Ionicons name="pulse-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.insightText}>{insight}</Text>
      </View>

      <View style={styles.ipCard}>
        <View style={styles.ipCopy}>
          <Text style={styles.ipTitle}>灵感糖果罐</Text>
          <Text style={styles.ipText}>每颗糖果都是一条灵感，颜色来自标签。被项目使用过的想法会轻轻发光，但依然留在这里。</Text>
        </View>
        <CandyJarVisual ideas={displayIdeas} tags={displayTags} ideaTags={displayIdeaTags} projectIdeas={projectIdeas} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  titleBlock: {
    gap: 4,
  },
  greeting: {
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  appName: {
    color: theme.colors.ink,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 0,
  },
  avatarSlot: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  heroText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  logoPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.blueSoft,
  },
  logoPillText: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  sectionHint: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  ideaStack: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  emptyCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primarySoft,
  },
  emptyTitle: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.greenSoft,
    marginBottom: theme.spacing.lg,
  },
  insightText: {
    flex: 1,
    color: theme.colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  ipCard: {
    minHeight: 244,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#C9795C',
    shadowOpacity: 0.09,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ipCopy: {
    flex: 1,
    minWidth: 150,
    gap: 8,
  },
  ipTitle: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  ipText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
