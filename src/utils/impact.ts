import type { CreativeProject, Outcome, ProjectIdea } from '../domain/models';

export type IdeaImpact = {
  usedCount: number;
  lastUsedAt?: string;
  usedProjects: CreativeProject[];
  completedOutcomeCount: number;
};

export function getIdeaImpact(input: {
  ideaId: string;
  projects: CreativeProject[];
  projectIdeas: ProjectIdea[];
  outcomes: Outcome[];
}): IdeaImpact {
  const usedProjectIds = Array.from(
    new Set(
      input.projectIdeas
        .filter((link) => link.idea_id === input.ideaId)
        .map((link) => link.project_id),
    ),
  );
  const usedProjects = input.projects.filter((project) => usedProjectIds.includes(project.id));
  const lastUsedAt = usedProjects
    .map((project) => project.updated_at)
    .sort((a, b) => b.localeCompare(a))[0];
  const completedOutcomeCount = input.outcomes.filter((outcome) =>
    usedProjectIds.includes(outcome.project_id),
  ).length;

  return {
    usedCount: usedProjectIds.length,
    lastUsedAt,
    usedProjects,
    completedOutcomeCount,
  };
}

export function getImpactInsight(input: {
  ideasLength: number;
  projects: CreativeProject[];
  projectIdeas: ProjectIdea[];
  outcomes: Outcome[];
}): string {
  const repeatedIdeaCount = new Set(input.projectIdeas.map((link) => link.idea_id)).size;
  const multiUseIdeaCount = Array.from(
    input.projectIdeas.reduce<Map<string, Set<string>>>((map, link) => {
      const projectIds = map.get(link.idea_id) ?? new Set<string>();
      projectIds.add(link.project_id);
      map.set(link.idea_id, projectIds);
      return map;
    }, new Map()),
  ).filter(([, projectIds]) => projectIds.size > 1).length;

  if (multiUseIdeaCount > 0) {
    return `${multiUseIdeaCount} 个想法正在反复影响你的创作`;
  }

  if (repeatedIdeaCount > 0) {
    return `有些想法正在进入项目，慢慢影响你的创作`;
  }

  if (input.outcomes.length > 0) {
    return `已经有想法转化成成果了，记得回看它们的来路`;
  }

  if (input.ideasLength > 0 && input.projects.length === 0) {
    return `这些灵感还在糖罐里，等着被你带进项目`;
  }

  return `有些想法正在反复影响你的创作`;
}
