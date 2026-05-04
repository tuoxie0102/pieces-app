import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import type { CreativeProject, OutcomeType } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { getOutcomeByProjectId, upsertOutcomeForProject } from '../storage/repositories/outcomeRepository';
import { getProjectById, updateProjectStatus } from '../storage/repositories/projectRepository';
import { theme } from '../theme/theme';
import { outcomeTypeOptions } from '../utils/outcomeType';

type OutcomeFormScreenProps = NativeStackScreenProps<RootStackParamList, 'OutcomeForm'>;

export function OutcomeFormScreen({ navigation, route }: OutcomeFormScreenProps) {
  const [project, setProject] = useState<CreativeProject | undefined>();
  const [type, setType] = useState<OutcomeType>('文章');
  const [resultDescription, setResultDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getProjectById(route.params.projectId), getOutcomeByProjectId(route.params.projectId)]).then(
      ([nextProject, existingOutcome]) => {
        setProject(nextProject);
        if (existingOutcome) {
          setType(existingOutcome.type);
          setResultDescription(existingOutcome.resultDescription);
        }
      },
    );
  }, [route.params.projectId]);

  const handleSave = async () => {
    const cleanDescription = resultDescription.trim();

    if (!cleanDescription) {
      Alert.alert('还没有转化说明', '写一句它最终转化成了什么，再放进成果库。');
      return;
    }

    setSaving(true);

    try {
      await updateProjectStatus(route.params.projectId, 'completed');
      const outcome = await upsertOutcomeForProject({
        projectId: route.params.projectId,
        type,
        resultDescription: cleanDescription,
      });

      navigation.replace('OutcomeDetail', { outcomeId: outcome.id });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.kicker}>完成项目</Text>
        <Text style={styles.title}>{project?.title ?? '项目'}</Text>
        <Text style={styles.copy}>项目完成后会沉淀为成果。这里记录的是完成后的转化结果，不是原始灵感。</Text>

        <Text style={styles.label}>成果类型</Text>
        <View style={styles.typeRow}>
          {outcomeTypeOptions.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => setType(option)}
              style={[styles.typeChip, type === option ? styles.typeChipActive : null]}
            >
              <Text style={[styles.typeText, type === option ? styles.typeTextActive : null]}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>它转化成了什么</Text>
        <TextInput
          value={resultDescription}
          onChangeText={setResultDescription}
          placeholder="例如：由三条产品灵感整理成了一篇发布文章..."
          placeholderTextColor={theme.colors.muted}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.descriptionInput]}
        />
      </View>

      <PrimaryButton label={saving ? '保存中...' : '放入成果库'} icon="checkmark" onPress={handleSave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  title: {
    color: theme.colors.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  copy: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  label: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    color: theme.colors.ink,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  descriptionInput: {
    minHeight: 150,
    lineHeight: 22,
  },
});
