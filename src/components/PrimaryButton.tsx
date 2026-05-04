import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '../theme/theme';

type PrimaryButtonProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: 'primary' | 'soft' | 'danger';
};

export function PrimaryButton({ label, icon, onPress, tone = 'primary' }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[tone], pressed ? styles.pressed : null]}
    >
      {icon ? <Ionicons name={icon} size={18} color={tone === 'primary' ? '#FFFFFF' : theme.colors.ink} /> : null}
      <Text style={[styles.label, tone === 'primary' ? styles.primaryLabel : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  soft: {
    backgroundColor: theme.colors.primarySoft,
  },
  danger: {
    backgroundColor: '#FFE1DC',
  },
  pressed: {
    opacity: 0.84,
  },
  label: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
});
