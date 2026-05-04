import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { TagChip } from '../components/TagChip';
import type { Tag } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { createTag, deleteTag, getTagUsageCounts, listTags, toggleFavoriteTag } from '../storage/repositories/tagRepository';
import { theme } from '../theme/theme';

type TagManagerScreenProps = NativeStackScreenProps<RootStackParamList, 'TagManager'>;

export function TagManagerScreen(_: TagManagerScreenProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState('');

  const refresh = useCallback(() => {
    Promise.all([listTags(), getTagUsageCounts()]).then(([nextTags, nextCounts]) => {
      setTags(nextTags);
      setUsageCounts(nextCounts);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleCreate = async () => {
    const cleanName = name.trim();

    if (!cleanName) {
      Alert.alert('标签名为空', '先给这枚标签取个名字。');
      return;
    }

    await createTag(cleanName);
    setName('');
    refresh();
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert('删除标签', `删除「${tag.name}」只会解除关联，不会删除任何灵感。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteTag(tag.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.createCard}>
        <Text style={styles.label}>新建标签</Text>
        <View style={styles.createRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="例如：产品灵感"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
          />
          <PrimaryButton label="创建" icon="add" onPress={handleCreate} />
        </View>
        <Text style={styles.helper}>同名标签会自动复用，避免重复创建。</Text>
      </View>

      <View style={styles.list}>
        {tags.length > 0 ? (
          tags.map((tag) => (
            <View key={tag.id} style={styles.tagRow}>
              <View style={styles.tagInfo}>
                <TagChip tag={tag} count={usageCounts[tag.id] ?? 0} />
                <Text style={styles.tagMeta}>使用 {usageCounts[tag.id] ?? 0} 次</Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={async () => {
                    await toggleFavoriteTag(tag.id);
                    refresh();
                  }}
                  style={[styles.iconButton, tag.isFavorite ? styles.favoriteButton : null]}
                >
                  <Ionicons
                    name={tag.isFavorite ? 'star' : 'star-outline'}
                    size={18}
                    color={tag.isFavorite ? theme.colors.primary : theme.colors.muted}
                  />
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => handleDelete(tag)} style={styles.iconButton}>
                  <Ionicons name="trash-outline" size={18} color={theme.colors.muted} />
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>还没有标签</Text>
            <Text style={styles.emptyText}>先创建几个常用标签，新建灵感时就能快速选择。</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  createCard: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  label: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  createRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 46,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    color: theme.colors.ink,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  helper: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: theme.spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tagInfo: {
    flex: 1,
    gap: 8,
  },
  tagMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  favoriteButton: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  empty: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primarySoft,
  },
  emptyTitle: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
