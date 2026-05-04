import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { ProjectCard } from '../components/ProjectCard';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import type { CreativeProject, ProjectIdea } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { listProjectIdeas } from '../storage/repositories/projectIdeaRepository';
import { listProjects } from '../storage/repositories/projectRepository';
import { theme } from '../theme/theme';

export function StudioScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.all([listProjects(), listProjectIdeas()]).then(([nextProjects, nextProjectIdeas]) => {
        if (!active) {
          return;
        }

        setProjects(nextProjects);
        setProjectIdeas(nextProjectIdeas);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const getIdeaCount = (projectId: string) =>
    projectIdeas.filter((link) => link.project_id === projectId).length;

  return (
    <Screen>
      <View style={styles.headerRow}>
        <SectionHeader title="创作区" caption="用灵感搭建项目、草稿和发布前的创作空间。" />
        <PrimaryButton label="创建" icon="add" onPress={() => navigation.navigate('ProjectForm')} />
      </View>

      {projects.length > 0 ? (
        <View style={styles.stack}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              ideaCount={getIdeaCount(project.id)}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>还没有创作项目</Text>
          <Text style={styles.emptyCopy}>创建一个项目，把几条灵感放进去，开始写说明或草稿。</Text>
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
  stack: {
    gap: theme.spacing.md,
  },
  emptyState: {
    minHeight: 170,
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
