import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Tag } from '../domain/models';
import { theme } from '../theme/theme';

type TagChipProps = {
  tag: Tag;
  selected?: boolean;
  count?: number;
  onPress?: () => void;
};

export function TagChip({ tag, selected = false, count, onPress }: TagChipProps) {
  const content = (
    <>
      {tag.isFavorite ? <Ionicons name="star" size={12} color={theme.colors.primary} /> : null}
      <Text style={styles.text}>{tag.name}</Text>
      {typeof count === 'number' ? <Text style={styles.count}>{count}</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.chip,
          { backgroundColor: selected || tag.isFavorite ? tag.color : `${tag.color}99` },
          tag.isFavorite ? styles.favorite : null,
          selected ? styles.selected : null,
          pressed ? styles.pressed : null,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: selected || tag.isFavorite ? tag.color : `${tag.color}99` },
        tag.isFavorite ? styles.favorite : null,
        selected ? styles.selected : null,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
  },
  favorite: {
    borderColor: theme.colors.primary,
  },
  selected: {
    borderColor: theme.colors.ink,
  },
  pressed: {
    opacity: 0.78,
  },
  text: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  count: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
});
