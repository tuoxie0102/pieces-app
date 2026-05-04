import type { Tag } from '../../domain/models';
import { getJson, setJson } from '../localStore';
import { storageKeys } from '../storageKeys';
import { listIdeaTags, removeIdeaTagLinksForTag } from './ideaTagRepository';

const tagPalette = ['#FCCEB4', '#D2E0AA', '#ABD7FB', '#FFE5D7', '#F7D9EF', '#D8E9DD'];

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export async function listTags(): Promise<Tag[]> {
  const tags = await getJson<Tag[]>(storageKeys.tags, []);
  return tags.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1;
    }

    return a.created_at.localeCompare(b.created_at);
  });
}

export async function createTag(name: string, color?: string): Promise<Tag> {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const tags = await listTags();
  const existing = tags.find((tag) => normalizeName(tag.name) === normalizeName(cleanName));

  if (existing) {
    return existing;
  }

  const tag: Tag = {
    id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: cleanName,
    color: color ?? tagPalette[tags.length % tagPalette.length],
    isFavorite: false,
    created_at: new Date().toISOString(),
  };

  await setJson(storageKeys.tags, [tag, ...tags]);
  return tag;
}

export async function deleteTag(tagId: string): Promise<void> {
  const tags = await listTags();
  await setJson(
    storageKeys.tags,
    tags.filter((tag) => tag.id !== tagId),
  );
  await removeIdeaTagLinksForTag(tagId);
}

export async function toggleFavoriteTag(tagId: string): Promise<void> {
  const tags = await listTags();
  await setJson(
    storageKeys.tags,
    tags.map((tag) => (tag.id === tagId ? { ...tag, isFavorite: !tag.isFavorite } : tag)),
  );
}

export async function getTagUsageCounts(): Promise<Record<string, number>> {
  const links = await listIdeaTags();

  return links.reduce<Record<string, number>>((counts, link) => {
    counts[link.tag_id] = (counts[link.tag_id] ?? 0) + 1;
    return counts;
  }, {});
}
