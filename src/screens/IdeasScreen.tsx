import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IdeaListCard } from '../components/IdeaListCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { TagChip } from '../components/TagChip';
import type { CreativeProject, Idea, IdeaTag, Outcome, ProjectIdea, Tag } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { listIdeaTags } from '../storage/repositories/ideaTagRepository';
import { listIdeas } from '../storage/repositories/ideaRepository';
import { listOutcomes } from '../storage/repositories/outcomeRepository';
import { listProjectIdeas } from '../storage/repositories/projectIdeaRepository';
import { listProjects } from '../storage/repositories/projectRepository';
import { listTags } from '../storage/repositories/tagRepository';
import { theme } from '../theme/theme';
import { getIdeaImpact } from '../utils/impact';

export function IdeasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ideaTags, setIdeaTags] = useState<IdeaTag[]>([]);
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.all([listIdeas(), listTags(), listIdeaTags(), listProjects(), listProjectIdeas(), listOutcomes()]).then(([nextIdeas, nextTags, nextIdeaTags, nextProjects, nextProjectIdeas, nextOutcomes]) => {
        if (active) {
          setIdeas(nextIdeas);
          setTags(nextTags);
          setIdeaTags(nextIdeaTags);
          setProjects(nextProjects);
          setProjectIdeas(nextProjectIdeas);
          setOutcomes(nextOutcomes);
        }
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const getTagsForIdea = (ideaId: string) => {
    const tagIds = ideaTags.filter((link) => link.idea_id === ideaId).map((link) => link.tag_id);
    return tags.filter((tag) => tagIds.includes(tag.id));
  };
  const getImpactForIdea = (ideaId: string) => getIdeaImpact({ ideaId, projects, projectIdeas, outcomes });

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  };

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredIdeas = ideas.filter((idea) => {
    const matchedKeyword = normalizedKeyword ? idea.content.toLowerCase().includes(normalizedKeyword) : true;
    const ideaTagIds = ideaTags.filter((link) => link.idea_id === idea.id).map((link) => link.tag_id);
    const matchedTags =
      selectedTagIds.length > 0 ? selectedTagIds.every((tagId) => ideaTagIds.includes(tagId)) : true;

    return matchedKeyword && matchedTags;
  });
  const hasFilter = normalizedKeyword.length > 0 || selectedTagIds.length > 0;

  return (
    <Screen>
      <View style={styles.headerRow}>
        <SectionHeader title="灵感库" caption="记录、标签、关联都在这里慢慢长出来。" />
        <PrimaryButton label="新增" icon="add" onPress={() => navigation.navigate('IdeaForm')} />
      </View>

      <View style={styles.searchCard}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={theme.colors.muted} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="搜索灵感正文关键词"
            placeholderTextColor={theme.colors.muted}
            style={styles.searchInput}
          />
          {keyword.length > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => setKeyword('')} style={styles.clearIcon}>
              <Ionicons name="close" size={16} color={theme.colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {tags.length > 0 ? (
          <View style={styles.filterBlock}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>按标签筛选</Text>
              {hasFilter ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setKeyword('');
                    setSelectedTagIds([]);
                  }}
                >
                  <Text style={styles.clearText}>清除</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.chipWrap}>
              {tags.map((tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  selected={selectedTagIds.includes(tag.id)}
                  onPress={() => toggleTag(tag.id)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {ideas.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>还没有灵感</Text>
          <Text style={styles.emptyCopy}>点一下新增，把第一颗创作糖果放进来。</Text>
        </View>
      ) : filteredIdeas.length > 0 ? (
        <View style={styles.stack}>
          {filteredIdeas.map((idea) => (
            <IdeaListCard
              key={idea.id}
              idea={idea}
              tags={getTagsForIdea(idea.id)}
              impact={getImpactForIdea(idea.id)}
              onPress={() => navigation.navigate('IdeaDetail', { ideaId: idea.id })}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>没有找到匹配的灵感</Text>
          <Text style={styles.emptyCopy}>换一个关键词，或者少选几个标签试试看。</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  emptyState: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
  },
  searchCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  searchBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  clearIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  filterBlock: {
    gap: theme.spacing.sm,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTitle: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  clearText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyTitle: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyCopy: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  stack: {
    gap: theme.spacing.md,
  },
});
