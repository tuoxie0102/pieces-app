import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { IdeaListCard } from '../components/IdeaListCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import type { CreativeProject, Idea, IdeaTag, ProjectIdea, ProjectStatus, Tag } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { listIdeaTags } from '../storage/repositories/ideaTagRepository';
import { listIdeas } from '../storage/repositories/ideaRepository';
import { getOutcomeByProjectId } from '../storage/repositories/outcomeRepository';
import { listProjectIdeas, removeIdeaFromProject } from '../storage/repositories/projectIdeaRepository';
import { getProjectById, updateProjectStatus } from '../storage/repositories/projectRepository';
import { listTags } from '../storage/repositories/tagRepository';
import { theme } from '../theme/theme';
import { formatDateTime } from '../utils/formatDate';
import { projectStatusLabels, projectStatusOptions } from '../utils/projectStatus';

type ProjectDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ProjectDetail'>;

export function ProjectDetailScreen({ navigation, route }: ProjectDetailScreenProps) {
  const [project, setProject] = useState<CreativeProject | undefined>();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ideaTags, setIdeaTags] = useState<IdeaTag[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);

  const refresh = useCallback(() => {
    Promise.all([
      getProjectById(route.params.projectId),
      listIdeas(),
      listTags(),
      listIdeaTags(),
      listProjectIdeas(),
    ]).then(([nextProject, nextIdeas, nextTags, nextIdeaTags, nextProjectIdeas]) => {
      setProject(nextProject);
      setIdeas(nextIdeas);
      setTags(nextTags);
      setIdeaTags(nextIdeaTags);
      setProjectIdeas(nextProjectIdeas);
    });
  }, [route.params.projectId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (!project) {
    return (
      <Screen>
        <Text style={styles.mutedText}>这个项目暂时没有找到。</Text>
      </Screen>
    );
  }

  const linkedIdeaIds = projectIdeas
    .filter((link) => link.project_id === project.id)
    .map((link) => link.idea_id);
  const linkedIdeas = ideas.filter((idea) => linkedIdeaIds.includes(idea.id));
  const getTagsForIdea = (ideaId: string) => {
    const tagIds = ideaTags.filter((link) => link.idea_id === ideaId).map((link) => link.tag_id);
    return tags.filter((tag) => tagIds.includes(tag.id));
  };

  const handleStatusChange = async (status: ProjectStatus) => {
    if (status === 'completed') {
      await updateProjectStatus(project.id, status);
      const existingOutcome = await getOutcomeByProjectId(project.id);
      if (existingOutcome) {
        navigation.navigate('OutcomeDetail', { outcomeId: existingOutcome.id });
        return;
      }
      navigation.navigate('OutcomeForm', { projectId: project.id });
      return;
    }

    await updateProjectStatus(project.id, status);
    refresh();
  };

  const handleRemoveIdea = (idea: Idea) => {
    Alert.alert('移出项目', '只会从这个项目里移除，不会删除原灵感。', [
      { text: '取消', style: 'cancel' },
      {
        text: '移出',
        onPress: async () => {
          await removeIdeaFromProject(project.id, idea.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.actionRow}>
        <PrimaryButton
          label="编辑项目"
          icon="create-outline"
          onPress={() => navigation.navigate('ProjectForm', { projectId: project.id })}
        />
        {project.status === 'completed' ? (
          <PrimaryButton
            label="成果记录"
            icon="albums-outline"
            tone="soft"
            onPress={() => navigation.navigate('OutcomeForm', { projectId: project.id })}
          />
        ) : null}
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.description}>{project.description || '还没有创作说明。'}</Text>

        <View style={styles.statusRow}>
          {projectStatusOptions.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => handleStatusChange(option)}
              style={[styles.statusChip, project.status === option ? styles.statusChipActive : null]}
            >
              <Text style={[styles.statusText, project.status === option ? styles.statusTextActive : null]}>
                {projectStatusLabels[option]}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>创建时间</Text>
          <Text style={styles.metaValue}>{formatDateTime(project.created_at)}</Text>
          <Text style={styles.metaLabel}>更新时间</Text>
          <Text style={styles.metaValue}>{formatDateTime(project.updated_at)}</Text>
        </View>
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>创作草稿</Text>
        <Text style={project.draftContent ? styles.draftText : styles.mutedText}>
          {project.draftContent || '还没有草稿，可以点编辑项目开始写。'}
        </Text>
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>已关联灵感</Text>
        {linkedIdeas.length > 0 ? (
          <View style={styles.ideaStack}>
            {linkedIdeas.map((idea) => (
              <View key={idea.id} style={styles.ideaWithAction}>
                <IdeaListCard
                  idea={idea}
                  tags={getTagsForIdea(idea.id)}
                  onPress={() => navigation.navigate('IdeaDetail', { ideaId: idea.id })}
                />
                <PrimaryButton label="移出项目" icon="remove-circle-outline" tone="soft" onPress={() => handleRemoveIdea(idea)} />
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.mutedText}>这个项目还没有关联灵感，编辑项目时可以加入素材。</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  heroCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primarySoft,
    shadowColor: '#C9795C',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  description: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
  },
  statusChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  statusTextActive: {
    color: '#FFFFFF',
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
  draftText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
  },
  ideaStack: {
    gap: theme.spacing.md,
  },
  ideaWithAction: {
    gap: theme.spacing.sm,
  },
  mutedText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
});
