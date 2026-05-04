import type { Idea } from '../../domain/models';
import { getJson, setJson } from '../localStore';
import { storageKeys } from '../storageKeys';
import { removeIdeaTagLinksForIdea, setTagIdsForIdea } from './ideaTagRepository';

export async function listIdeas(): Promise<Idea[]> {
  const ideas = await getJson<Idea[]>(storageKeys.ideas, []);
  return ideas.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function saveIdeas(ideas: Idea[]): Promise<void> {
  await setJson(storageKeys.ideas, ideas);
}

export async function getIdeaById(id: string): Promise<Idea | undefined> {
  const ideas = await listIdeas();
  return ideas.find((idea) => idea.id === id);
}

export async function createIdea(input: {
  content: string;
  tagIds: string[];
  imageUri?: string;
  relatedIdeaIds: string[];
}): Promise<Idea> {
  const now = new Date().toISOString();
  const idea: Idea = {
    id: `idea-${Date.now()}`,
    content: input.content,
    imageUri: input.imageUri,
    relatedIdeaIds: input.relatedIdeaIds,
    status: input.relatedIdeaIds.length > 0 ? 'linked' : 'inbox',
    created_at: now,
    updated_at: now,
  };
  const ideas = await listIdeas();
  await saveIdeas([idea, ...ideas]);
  await setTagIdsForIdea(idea.id, input.tagIds);
  return idea;
}

export async function updateIdea(
  id: string,
  input: {
    content: string;
    tagIds: string[];
    imageUri?: string;
    relatedIdeaIds: string[];
  },
): Promise<Idea | undefined> {
  const ideas = await listIdeas();
  const existing = ideas.find((idea) => idea.id === id);

  if (!existing) {
    return undefined;
  }

  const updated: Idea = {
    ...existing,
    content: input.content,
    imageUri: input.imageUri,
    relatedIdeaIds: input.relatedIdeaIds,
    status: input.relatedIdeaIds.length > 0 ? 'linked' : existing.status,
    updated_at: new Date().toISOString(),
  };

  await saveIdeas(ideas.map((idea) => (idea.id === id ? updated : idea)));
  await setTagIdsForIdea(id, input.tagIds);
  return updated;
}

export async function deleteIdea(id: string): Promise<void> {
  const ideas = await listIdeas();
  const nextIdeas = ideas
    .filter((idea) => idea.id !== id)
    .map((idea) => ({
      ...idea,
      relatedIdeaIds: idea.relatedIdeaIds.filter((relatedId) => relatedId !== id),
    }));

  await saveIdeas(nextIdeas);
  await removeIdeaTagLinksForIdea(id);
}
