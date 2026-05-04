import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme/theme';

type MetricTileProps = {
  label: string;
  value: string;
  tone?: 'primary' | 'accent' | 'neutral';
};

export function MetricTile({ label, value, tone = 'neutral' }: MetricTileProps) {
  return (
    <View style={[styles.container, styles[tone]]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 68,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    justifyContent: 'space-between',
  },
  primary: {
    backgroundColor: theme.colors.primarySoft,
  },
  accent: {
    backgroundColor: theme.colors.greenSoft,
  },
  neutral: {
    backgroundColor: theme.colors.blueSoft,
  },
  value: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  label: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
});
