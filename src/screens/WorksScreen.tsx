import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OutcomeCard } from '../components/OutcomeCard';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import type { CreativeProject, Outcome, ProjectIdea } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { listOutcomes } from '../storage/repositories/outcomeRepository';
import { listProjectIdeas } from '../storage/repositories/projectIdeaRepository';
import { listProjects } from '../storage/repositories/projectRepository';
import { theme } from '../theme/theme';

export function WorksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([listOutcomes(), listProjects(), listProjectIdeas()]).then(
        ([nextOutcomes, nextProjects, nextProjectIdeas]) => {
          if (!active) {
            return;
          }
          setOutcomes(nextOutcomes);
          setProjects(nextProjects);
          setProjectIdeas(nextProjectIdeas);
        },
      );

      return () => {
        active = false;
      };
    }, []),
  );

  const getProject = (projectId: string) => projects.find((project) => project.id === projectId);
  const getIdeaCount = (projectId: string) =>
    projectIdeas.filter((link) => link.project_id === projectId).length;

  return (
    <Screen>
      <SectionHeader title="成果库" caption="这里沉淀完成后的项目成果，而不是原始灵感。" />

      {outcomes.length > 0 ? (
        <View style={styles.stack}>
          {outcomes.map((outcome) => (
            <OutcomeCard
              key={outcome.id}
              outcome={outcome}
              project={getProject(outcome.project_id)}
              ideaCount={getIdeaCount(outcome.project_id)}
              onPress={() => navigation.navigate('OutcomeDetail', { outcomeId: outcome.id })}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>还没有成果</Text>
          <Text style={styles.emptyCopy}>当创作区里的项目标记为已完成，并填写转化说明后，会自动来到这里。</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: theme.spacing.md,
  },
  emptyState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  emptyTitle: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptyCopy: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
