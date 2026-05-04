import type { IdeaTag } from '../../domain/models';
import { getJson, setJson } from '../localStore';
import { storageKeys } from '../storageKeys';

export async function listIdeaTags(): Promise<IdeaTag[]> {
  return getJson<IdeaTag[]>(storageKeys.ideaTags, []);
}

export async function getTagIdsForIdea(ideaId: string): Promise<string[]> {
  const links = await listIdeaTags();
  return links.filter((link) => link.idea_id === ideaId).map((link) => link.tag_id);
}

export async function setTagIdsForIdea(ideaId: string, tagIds: string[]): Promise<void> {
  const links = await listIdeaTags();
  const uniqueTagIds = Array.from(new Set(tagIds));
  const nextLinks = [
    ...links.filter((link) => link.idea_id !== ideaId),
    ...uniqueTagIds.map((tagId) => ({ idea_id: ideaId, tag_id: tagId })),
  ];

  await setJson(storageKeys.ideaTags, nextLinks);
}

export async function removeIdeaTagLinksForIdea(ideaId: string): Promise<void> {
  const links = await listIdeaTags();
  await setJson(
    storageKeys.ideaTags,
    links.filter((link) => link.idea_id !== ideaId),
  );
}

export async function removeIdeaTagLinksForTag(tagId: string): Promise<void> {
  const links = await listIdeaTags();
  await setJson(
    storageKeys.ideaTags,
    links.filter((link) => link.tag_id !== tagId),
  );
}
