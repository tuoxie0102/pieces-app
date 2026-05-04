import type { CreativeProject } from '../../domain/models';
import { getJson, setJson } from '../localStore';
import { storageKeys } from '../storageKeys';
import { getIdeaIdsForProject, removeProjectIdeaLinksForProject, setIdeaIdsForProject } from './projectIdeaRepository';

export async function listProjects(): Promise<CreativeProject[]> {
  const projects = await getJson<Array<CreativeProject & { updatedAt?: string }>>(storageKeys.projects, []);
  return projects
    .map((project) => ({
      ...project,
      description: project.description ?? '',
      draftContent: project.draftContent ?? '',
      status: project.status ?? 'draft',
      created_at: project.created_at ?? project.updatedAt ?? new Date().toISOString(),
      updated_at: project.updated_at ?? project.updatedAt ?? new Date().toISOString(),
    }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function saveProjects(projects: CreativeProject[]): Promise<void> {
  await setJson(storageKeys.projects, projects);
}

export async function getProjectById(id: string): Promise<CreativeProject | undefined> {
  const projects = await listProjects();
  return projects.find((project) => project.id === id);
}

export async function createProject(input: {
  title: string;
  description: string;
  draftContent: string;
  status: CreativeProject['status'];
  ideaIds: string[];
}): Promise<CreativeProject> {
  const now = new Date().toISOString();
  const project: CreativeProject = {
    id: `project-${Date.now()}`,
    title: input.title,
    description: input.description,
    draftContent: input.draftContent,
    status: input.status,
    created_at: now,
    updated_at: now,
  };
  const projects = await listProjects();
  await saveProjects([project, ...projects]);
  await setIdeaIdsForProject(project.id, input.ideaIds);
  return project;
}

export async function updateProject(
  id: string,
  input: {
    title: string;
    description: string;
    draftContent: string;
    status: CreativeProject['status'];
    ideaIds: string[];
  },
): Promise<CreativeProject | undefined> {
  const projects = await listProjects();
  const existing = projects.find((project) => project.id === id);

  if (!existing) {
    return undefined;
  }

  const updated: CreativeProject = {
    ...existing,
    title: input.title,
    description: input.description,
    draftContent: input.draftContent,
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  await saveProjects(projects.map((project) => (project.id === id ? updated : project)));
  await setIdeaIdsForProject(id, input.ideaIds);
  return updated;
}

export async function updateProjectStatus(
  id: string,
  status: CreativeProject['status'],
): Promise<CreativeProject | undefined> {
  const project = await getProjectById(id);

  if (!project) {
    return undefined;
  }

  const ideaIds = await getIdeaIdsForProject(id);
  return updateProject(id, {
    title: project.title,
    description: project.description,
    draftContent: project.draftContent,
    status,
    ideaIds,
  });
}

export async function deleteProject(id: string): Promise<void> {
  const projects = await listProjects();
  await saveProjects(projects.filter((project) => project.id !== id));
  await removeProjectIdeaLinksForProject(id);
}
