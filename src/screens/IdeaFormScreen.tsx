import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { TagChip } from '../components/TagChip';
import type { Idea, IdeaTag, Tag } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { getTagIdsForIdea, listIdeaTags } from '../storage/repositories/ideaTagRepository';
import { createIdea, getIdeaById, listIdeas, updateIdea } from '../storage/repositories/ideaRepository';
import { createTag, listTags } from '../storage/repositories/tagRepository';
import { theme } from '../theme/theme';
import { formatDateTime } from '../utils/formatDate';

type IdeaFormScreenProps = NativeStackScreenProps<RootStackParamList, 'IdeaForm'>;

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractKeywords(value: string): string[] {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  const words = normalized
    .split(/[\s,，。.!！?？、:：;；"'“”‘’（）()[\]{}<>《》/\\|]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);

  if (words.length > 0) {
    return Array.from(new Set(words));
  }

  const grams: string[] = [];

  for (let index = 0; index < normalized.length - 1; index += 1) {
    grams.push(normalized.slice(index, index + 2));
  }

  return Array.from(new Set(grams));
}

function getTagsForIdea(ideaId: string, tags: Tag[], ideaTags: IdeaTag[]): Tag[] {
  const tagIds = ideaTags.filter((link) => link.idea_id === ideaId).map((link) => link.tag_id);
  return tags.filter((tag) => tagIds.includes(tag.id));
}

function getRecommendedIdeas(input: {
  ideaId?: string;
  content: string;
  selectedTagIds: string[];
  ideas: Idea[];
  ideaTags: IdeaTag[];
}): Idea[] {
  const keywords = extractKeywords(input.content);

  return input.ideas
    .filter((idea) => idea.id !== input.ideaId)
    .map((idea) => {
      const candidateTagIds = input.ideaTags
        .filter((link) => link.idea_id === idea.id)
        .map((link) => link.tag_id);
      const sameTagCount = input.selectedTagIds.filter((tagId) => candidateTagIds.includes(tagId)).length;
      const keywordCount = keywords.filter((keyword) => idea.content.toLowerCase().includes(keyword)).length;

      return {
        idea,
        score: sameTagCount * 3 + keywordCount,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.idea.updated_at.localeCompare(a.idea.updated_at))
    .slice(0, 6)
    .map((item) => item.idea);
}

export function IdeaFormScreen({ navigation, route }: IdeaFormScreenProps) {
  const ideaId = route.params?.ideaId;
  const [content, setContent] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [ideaTags, setIdeaTags] = useState<IdeaTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([listTags(), listIdeas(), listIdeaTags()]).then(([nextTags, nextIdeas, nextIdeaTags]) => {
      setTags(nextTags);
      setAllIdeas(nextIdeas);
      setIdeaTags(nextIdeaTags);
    });

    if (ideaId) {
      Promise.all([getIdeaById(ideaId), getTagIdsForIdea(ideaId)]).then(([idea, tagIds]) => {
        if (!idea) {
          return;
        }

        setContent(idea.content);
        setSelectedTagIds(tagIds);
        setSelectedRelatedIds(idea.relatedIdeaIds);
        setImageUri(idea.imageUri ?? '');
      });
    }
  }, [ideaId]);

  const favoriteTags = tags.filter((tag) => tag.isFavorite);
  const regularTags = tags.filter((tag) => !tag.isFavorite);
  const recommendedIdeas = getRecommendedIdeas({
    ideaId,
    content,
    selectedTagIds,
    ideas: allIdeas,
    ideaTags,
  });
  const manuallySelectableIdeas = allIdeas.filter((idea) => idea.id !== ideaId);
  const selectedRelatedIdeas = manuallySelectableIdeas.filter((idea) => selectedRelatedIds.includes(idea.id));

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  };

  const toggleRelatedIdea = (relatedIdeaId: string) => {
    setSelectedRelatedIds((current) =>
      current.includes(relatedIdeaId)
        ? current.filter((id) => id !== relatedIdeaId)
        : [...current, relatedIdeaId],
    );
  };

  const handleSave = async () => {
    const nextContent = content.trim();

    if (!nextContent) {
      Alert.alert('还没有正文', '先写下这颗灵感的内容，再保存。');
      return;
    }

    setSaving(true);
    const createdTags = await Promise.all(splitCsv(tagsText).map((tagName) => createTag(tagName)));
    const tagIds = Array.from(new Set([...selectedTagIds, ...createdTags.map((tag) => tag.id)]));
    const payload = {
      content: nextContent,
      tagIds,
      imageUri: imageUri.trim() || undefined,
      relatedIdeaIds: selectedRelatedIds.filter((relatedId) => relatedId !== ideaId),
    };

    try {
      const idea = ideaId ? await updateIdea(ideaId, payload) : await createIdea(payload);

      if (!idea) {
        Alert.alert('保存失败', '没有找到要编辑的灵感。');
        return;
      }

      navigation.replace('IdeaDetail', { ideaId: idea.id });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.formCard}>
        <Text style={styles.label}>灵感正文</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="写下刚刚闪过的念头..."
          placeholderTextColor={theme.colors.muted}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.contentInput]}
        />

        <Text style={styles.label}>标签</Text>
        {favoriteTags.length > 0 ? (
          <>
            <Text style={styles.helper}>常用标签</Text>
            <View style={styles.chipWrap}>
              {favoriteTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  selected={selectedTagIds.includes(tag.id)}
                  onPress={() => toggleTag(tag.id)}
                />
              ))}
            </View>
          </>
        ) : null}
        {regularTags.length > 0 ? (
          <>
            <Text style={styles.helper}>已有标签</Text>
            <View style={styles.chipWrap}>
              {regularTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  selected={selectedTagIds.includes(tag.id)}
                  onPress={() => toggleTag(tag.id)}
                />
              ))}
            </View>
          </>
        ) : null}
        <TextInput
          value={tagsText}
          onChangeText={setTagsText}
          placeholder="输入新标签，例如：产品, 文案, 分享卡片"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>关联灵感</Text>
        {recommendedIdeas.length > 0 ? (
          <View style={styles.recommendBox}>
            <Text style={styles.recommendTitle}>你之前也记录过类似的想法</Text>
            <Text style={styles.helper}>可以选择关联，关联只是建立线索，不会覆盖或删除任何灵感。</Text>
            <View style={styles.relatedStack}>
              {recommendedIdeas.map((idea) => (
                <RelatedIdeaOption
                  key={idea.id}
                  idea={idea}
                  tags={getTagsForIdea(idea.id, tags, ideaTags)}
                  selected={selectedRelatedIds.includes(idea.id)}
                  onPress={() => toggleRelatedIdea(idea.id)}
                />
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.helper}>选择标签或写下正文后，这里会温和推荐可能相关的旧灵感。</Text>
        )}

        {selectedRelatedIdeas.length > 0 ? (
          <>
            <Text style={styles.helper}>已选择关联</Text>
            <View style={styles.relatedStack}>
              {selectedRelatedIdeas.map((idea) => (
                <RelatedIdeaOption
                  key={idea.id}
                  idea={idea}
                  tags={getTagsForIdea(idea.id, tags, ideaTags)}
                  selected
                  onPress={() => toggleRelatedIdea(idea.id)}
                />
              ))}
            </View>
          </>
        ) : null}

        {manuallySelectableIdeas.length > 0 ? (
          <>
            <Text style={styles.helper}>手动选择关联灵感</Text>
            <View style={styles.relatedStack}>
              {manuallySelectableIdeas.slice(0, 8).map((idea) => (
                <RelatedIdeaOption
                  key={idea.id}
                  idea={idea}
                  tags={getTagsForIdea(idea.id, tags, ideaTags)}
                  selected={selectedRelatedIds.includes(idea.id)}
                  onPress={() => toggleRelatedIdea(idea.id)}
                />
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.label}>图片 URI 预留</Text>
        <TextInput
          value={imageUri}
          onChangeText={setImageUri}
          placeholder="暂不实现上传，可先留空"
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
          style={styles.input}
        />
      </View>

      <PrimaryButton
        label={saving ? '保存中...' : ideaId ? '保存修改' : '保存灵感'}
        icon="checkmark"
        onPress={handleSave}
      />
    </Screen>
  );
}

function RelatedIdeaOption({
  idea,
  tags,
  selected,
  onPress,
}: {
  idea: Idea;
  tags: Tag[];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.relatedOption,
        selected ? styles.relatedOptionSelected : null,
        pressed ? styles.relatedOptionPressed : null,
      ]}
    >
      <View style={styles.relatedTextBlock}>
        <Text style={styles.relatedContent} numberOfLines={2}>
          {idea.content}
        </Text>
        <Text style={styles.relatedTime}>{formatDateTime(idea.created_at)}</Text>
        <View style={styles.relatedTags}>
          {tags.slice(0, 3).map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </View>
      </View>
      <View style={[styles.selectDot, selected ? styles.selectDotActive : null]}>
        <Text style={styles.selectDotText}>{selected ? '✓' : ''}</Text>
      </View>
    </Pressable>
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
  helper: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  recommendBox: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.greenSoft,
  },
  recommendTitle: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
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
  contentInput: {
    minHeight: 150,
    lineHeight: 22,
  },
  relatedStack: {
    gap: theme.spacing.sm,
  },
  relatedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  relatedOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.accentSoft,
  },
  relatedOptionPressed: {
    opacity: 0.84,
  },
  relatedTextBlock: {
    flex: 1,
    gap: 6,
  },
  relatedContent: {
    color: theme.colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  relatedTime: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  relatedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectDot: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  selectDotActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  selectDotText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
