import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IdeaListCard } from '../components/IdeaListCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import type { CreativeProject, Idea, IdeaTag, ProjectStatus, Tag } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { listIdeaTags } from '../storage/repositories/ideaTagRepository';
import { listIdeas } from '../storage/repositories/ideaRepository';
import { getIdeaIdsForProject } from '../storage/repositories/projectIdeaRepository';
import { createProject, getProjectById, updateProject } from '../storage/repositories/projectRepository';
import { listTags } from '../storage/repositories/tagRepository';
import { theme } from '../theme/theme';
import { projectStatusLabels, projectStatusOptions } from '../utils/projectStatus';

type ProjectFormScreenProps = NativeStackScreenProps<RootStackParamList, 'ProjectForm'>;

export function ProjectFormScreen({ navigation, route }: ProjectFormScreenProps) {
  const projectId = route.params?.projectId;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ideaTags, setIdeaTags] = useState<IdeaTag[]>([]);
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([listIdeas(), listTags(), listIdeaTags()]).then(([nextIdeas, nextTags, nextIdeaTags]) => {
      setIdeas(nextIdeas);
      setTags(nextTags);
      setIdeaTags(nextIdeaTags);
    });

    if (projectId) {
      Promise.all([getProjectById(projectId), getIdeaIdsForProject(projectId)]).then(([project, ideaIds]) => {
        if (!project) {
          return;
        }

        setTitle(project.title);
        setDescription(project.description);
        setDraftContent(project.draftContent);
        setStatus(project.status);
        setSelectedIdeaIds(ideaIds);
      });
    }
  }, [projectId]);

  const getTagsForIdea = (ideaId: string) => {
    const tagIds = ideaTags.filter((link) => link.idea_id === ideaId).map((link) => link.tag_id);
    return tags.filter((tag) => tagIds.includes(tag.id));
  };

  const toggleIdea = (ideaId: string) => {
    setSelectedIdeaIds((current) =>
      current.includes(ideaId) ? current.filter((id) => id !== ideaId) : [...current, ideaId],
    );
  };

  const handleSave = async () => {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      Alert.alert('项目还没有标题', '先给这个创作空间取个名字。');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: cleanTitle,
        description: description.trim(),
        draftContent: draftContent.trim(),
        status,
        ideaIds: selectedIdeaIds,
      };
      const project: CreativeProject | undefined = projectId
        ? await updateProject(projectId, payload)
        : await createProject(payload);

      if (!project) {
        Alert.alert('保存失败', '没有找到要编辑的项目。');
        return;
      }

      if (status === 'completed') {
        navigation.replace('OutcomeForm', { projectId: project.id });
        return;
      }

      navigation.replace('ProjectDetail', { projectId: project.id });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.formCard}>
        <Text style={styles.label}>项目标题</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="例如：灵感糖罐 App 第一版"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>创作说明</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="这个项目想解决什么，准备用哪些灵感？"
          placeholderTextColor={theme.colors.muted}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.mediumInput]}
        />

        <Text style={styles.label}>创作草稿</Text>
        <TextInput
          value={draftContent}
          onChangeText={setDraftContent}
          placeholder="先写一点草稿、结构或开头..."
          placeholderTextColor={theme.colors.muted}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.draftInput]}
        />

        <Text style={styles.label}>项目状态</Text>
        <View style={styles.statusRow}>
          {projectStatusOptions.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => setStatus(option)}
              style={[styles.statusChip, status === option ? styles.statusChipActive : null]}
            >
              <Text style={[styles.statusText, status === option ? styles.statusTextActive : null]}>
                {projectStatusLabels[option]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.ideaSection}>
        <Text style={styles.sectionTitle}>关联灵感</Text>
        <Text style={styles.helper}>一条灵感可以被多个项目反复使用，这里只是加入项目素材。</Text>
        {ideas.length > 0 ? (
          <View style={styles.ideaStack}>
            {ideas.map((idea) => (
              <View key={idea.id} style={selectedIdeaIds.includes(idea.id) ? styles.selectedIdea : null}>
                <IdeaListCard idea={idea} tags={getTagsForIdea(idea.id)} onPress={() => toggleIdea(idea.id)} />
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>还没有灵感，先去灵感库记录几条素材。</Text>
        )}
      </View>

      <PrimaryButton label={saving ? '保存中...' : '保存项目'} icon="checkmark" onPress={handleSave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: 9,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  label: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 6,
  },
  input: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    color: theme.colors.ink,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mediumInput: {
    minHeight: 92,
    lineHeight: 22,
  },
  draftInput: {
    minHeight: 150,
    lineHeight: 22,
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
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  ideaSection: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.greenSoft,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  helper: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  ideaStack: {
    gap: theme.spacing.md,
  },
  selectedIdea: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
});
