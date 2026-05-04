import type { ProjectIdea } from '../../domain/models';
import { getJson, setJson } from '../localStore';
import { storageKeys } from '../storageKeys';

export async function listProjectIdeas(): Promise<ProjectIdea[]> {
  return getJson<ProjectIdea[]>(storageKeys.projectIdeas, []);
}

export async function getIdeaIdsForProject(projectId: string): Promise<string[]> {
  const links = await listProjectIdeas();
  return links.filter((link) => link.project_id === projectId).map((link) => link.idea_id);
}

export async function setIdeaIdsForProject(projectId: string, ideaIds: string[]): Promise<void> {
  const links = await listProjectIdeas();
  const uniqueIdeaIds = Array.from(new Set(ideaIds));
  const nextLinks = [
    ...links.filter((link) => link.project_id !== projectId),
    ...uniqueIdeaIds.map((ideaId) => ({ project_id: projectId, idea_id: ideaId })),
  ];

  await setJson(storageKeys.projectIdeas, nextLinks);
}

export async function removeIdeaFromProject(projectId: string, ideaId: string): Promise<void> {
  const links = await listProjectIdeas();
  await setJson(
    storageKeys.projectIdeas,
    links.filter((link) => !(link.project_id === projectId && link.idea_id === ideaId)),
  );
}

export async function removeProjectIdeaLinksForProject(projectId: string): Promise<void> {
  const links = await listProjectIdeas();
  await setJson(
    storageKeys.projectIdeas,
    links.filter((link) => link.project_id !== projectId),
  );
}
