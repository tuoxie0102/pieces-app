import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme/theme';

type SectionHeaderProps = {
  title: string;
  caption?: string;
};

export function SectionHeader({ title, caption }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0,
  },
  caption: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
