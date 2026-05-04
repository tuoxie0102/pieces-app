import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IdeaListCard } from '../components/IdeaListCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import type { CreativeProject, Idea, IdeaTag, Outcome, ProjectIdea, Tag } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { listIdeaTags } from '../storage/repositories/ideaTagRepository';
import { listIdeas } from '../storage/repositories/ideaRepository';
import { getOutcomeById } from '../storage/repositories/outcomeRepository';
import { listProjectIdeas } from '../storage/repositories/projectIdeaRepository';
import { getProjectById } from '../storage/repositories/projectRepository';
import { listTags } from '../storage/repositories/tagRepository';
import { theme } from '../theme/theme';
import { formatDateTime } from '../utils/formatDate';

type OutcomeDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'OutcomeDetail'>;

export function OutcomeDetailScreen({ navigation, route }: OutcomeDetailScreenProps) {
  const [outcome, setOutcome] = useState<Outcome | undefined>();
  const [project, setProject] = useState<CreativeProject | undefined>();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ideaTags, setIdeaTags] = useState<IdeaTag[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getOutcomeById(route.params.outcomeId).then((nextOutcome) => {
        if (!nextOutcome) {
          if (active) {
            setOutcome(undefined);
          }
          return;
        }

        Promise.all([
          getProjectById(nextOutcome.project_id),
          listIdeas(),
          listTags(),
          listIdeaTags(),
          listProjectIdeas(),
        ]).then(([nextProject, nextIdeas, nextTags, nextIdeaTags, nextProjectIdeas]) => {
          if (!active) {
            return;
          }

          setOutcome(nextOutcome);
          setProject(nextProject);
          setIdeas(nextIdeas);
          setTags(nextTags);
          setIdeaTags(nextIdeaTags);
          setProjectIdeas(nextProjectIdeas);
        });
      });

      return () => {
        active = false;
      };
    }, [route.params.outcomeId]),
  );

  if (!outcome) {
    return (
      <Screen>
        <Text style={styles.mutedText}>这个成果暂时没有找到。</Text>
      </Screen>
    );
  }

  const linkedIdeaIds = projectIdeas
    .filter((link) => link.project_id === outcome.project_id)
    .map((link) => link.idea_id);
  const linkedIdeas = ideas.filter((idea) => linkedIdeaIds.includes(idea.id));
  const getTagsForIdea = (ideaId: string) => {
    const tagIds = ideaTags.filter((link) => link.idea_id === ideaId).map((link) => link.tag_id);
    return tags.filter((tag) => tagIds.includes(tag.id));
  };

  return (
    <Screen>
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>成果名称</Text>
        <Text style={styles.title}>{project?.title ?? '未命名成果'}</Text>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{outcome.type}</Text>
        </View>

        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>完成时间</Text>
          <Text style={styles.metaValue}>{formatDateTime(outcome.completed_at)}</Text>
          <Text style={styles.metaLabel}>成果类型</Text>
          <Text style={styles.metaValue}>{outcome.type}</Text>
        </View>
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>转化说明</Text>
        <Text style={styles.bodyText}>{outcome.resultDescription}</Text>
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>来源项目</Text>
        {project ? (
          <View style={styles.projectBox}>
            <Text style={styles.projectTitle}>{project.title}</Text>
            <Text style={styles.projectDescription}>{project.description || '这个项目没有填写说明。'}</Text>
            <PrimaryButton
              label="查看项目"
              icon="folder-open-outline"
              tone="soft"
              onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
            />
          </View>
        ) : (
          <Text style={styles.mutedText}>来源项目暂时没有找到。</Text>
        )}
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>关联过的灵感</Text>
        {linkedIdeas.length > 0 ? (
          <View style={styles.ideaStack}>
            {linkedIdeas.map((idea) => (
              <IdeaListCard
                key={idea.id}
                idea={idea}
                tags={getTagsForIdea(idea.id)}
                onPress={() => navigation.navigate('IdeaDetail', { ideaId: idea.id })}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.mutedText}>这个成果的来源项目没有关联灵感。</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.blueSoft,
    shadowColor: '#C9795C',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  kicker: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  title: {
    color: theme.colors.ink,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '900',
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
  },
  typeText: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  metaBox: {
    gap: 5,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.44)',
  },
  metaLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  metaValue: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },
  sectionBox: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  bodyText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
  },
  projectBox: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primarySoft,
  },
  projectTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  projectDescription: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  ideaStack: {
    gap: theme.spacing.md,
  },
  mutedText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
});
