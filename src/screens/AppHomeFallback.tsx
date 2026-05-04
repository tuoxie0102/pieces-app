import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { theme } from '../theme/theme';

type TabKey = 'home' | 'ideas' | 'studio' | 'works' | 'profile';

type Idea = {
  id: string;
  title?: string;
  content: string;
  created_at: string;
  updated_at: string;
  imageUri?: string;
  relatedIdeaIds: string[];
};

type Tag = {
  id: string;
  name: string;
  color: string;
  isFavorite: boolean;
  created_at: string;
};

type IdeaTag = {
  idea_id: string;
  tag_id: string;
};

type ProjectStatus = 'draft' | 'in_progress' | 'completed';

type Project = {
  id: string;
  title: string;
  description: string;
  draftContent: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

type ProjectIdea = {
  project_id: string;
  idea_id: string;
};

type OutcomeType = string;

type Outcome = {
  id: string;
  project_id: string;
  type: OutcomeType;
  resultDescription: string;
  completed_at: string;
};

type ExportContentType = 'ideas' | 'projects' | 'outcomes';

type ExportOptions = {
  type: ExportContentType;
  tagIds: string[];
  startDate: string;
  endDate: string;
};

const IDEAS_STORAGE_KEY = '@pieces/ideas';
const TAGS_STORAGE_KEY = '@pieces/tags';
const IDEA_TAGS_STORAGE_KEY = '@pieces/idea_tags';
const PROJECTS_STORAGE_KEY = '@pieces/projects';
const PROJECT_IDEAS_STORAGE_KEY = '@pieces/project_ideas';
const OUTCOMES_STORAGE_KEY = '@pieces/outcomes';
const TAG_COLORS = ['#F98C53', '#D2E0AA', '#ABD7FB', '#FCCEB4', '#FFE5D7'];
const candyPalette = ['#FFF1E8', '#F3F7EA', '#EEF6FD', '#FBEAEA', '#FCCEB4', '#D2E0AA', '#ABD7FB'];
const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'home', label: '首页' },
  { key: 'ideas', label: '灵感库' },
  { key: 'studio', label: '创作区' },
  { key: 'works', label: '灵感小窝' },
  { key: 'profile', label: '设置' },
];

const initialIdeas: Idea[] = [
  {
    id: 'idea-1',
    title: '温柔创作入口',
    content: '把灵感记录做成一个温柔的创作入口，而不是普通备忘录。',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    imageUri: undefined,
    relatedIdeaIds: [],
  },
  {
    id: 'idea-2',
    title: '想法长成成果',
    content: '每一条想法都可以慢慢长成项目、成果和分享卡片。',
    created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    imageUri: undefined,
    relatedIdeaIds: [],
  },
  {
    id: 'idea-3',
    title: '没有压力的首页',
    content: '首页应该让人一打开就想继续记录，而不是感到有压力。',
    created_at: new Date(Date.now() - 7200 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7200 * 1000).toISOString(),
    imageUri: undefined,
    relatedIdeaIds: [],
  },
];

export function AppHomeFallback() {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [screen, setScreen] = useState<'home' | 'create' | 'detail' | 'projectCreate' | 'projectDetail' | 'outcomeForm' | 'outcomeDetail'>('home');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [draft, setDraft] = useState('');
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ideaTags, setIdeaTags] = useState<IdeaTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagText, setNewTagText] = useState('');
  const [pendingTagNames, setPendingTagNames] = useState<string[]>([]);
  const [selectedRelatedIdeaIds, setSelectedRelatedIdeaIds] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);
  const [projectTitleDraft, setProjectTitleDraft] = useState('');
  const [projectDescriptionDraft, setProjectDescriptionDraft] = useState('');
  const [projectDraftContent, setProjectDraftContent] = useState('');
  const [outcomeType, setOutcomeType] = useState<OutcomeType>('文章');
  const [outcomeDescription, setOutcomeDescription] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(IDEAS_STORAGE_KEY).then((raw) => {
      if (!raw) {
        setIdeas(initialIdeas);
        AsyncStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(initialIdeas));
        return;
      }

      try {
        setIdeas(
          (JSON.parse(raw) as Idea[]).map((idea) => ({
            ...idea,
            relatedIdeaIds: idea.relatedIdeaIds ?? [],
          })),
        );
      } catch {
        setIdeas(initialIdeas);
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(TAGS_STORAGE_KEY).then((raw) => {
      if (!raw) {
        return;
      }

      try {
        setTags(JSON.parse(raw) as Tag[]);
      } catch {
        setTags([]);
      }
    });

    AsyncStorage.getItem(IDEA_TAGS_STORAGE_KEY).then((raw) => {
      if (!raw) {
        return;
      }

      try {
        setIdeaTags(JSON.parse(raw) as IdeaTag[]);
      } catch {
        setIdeaTags([]);
      }
    });

    AsyncStorage.getItem(PROJECTS_STORAGE_KEY).then((raw) => {
      if (!raw) {
        return;
      }

      try {
        setProjects(JSON.parse(raw) as Project[]);
      } catch {
        setProjects([]);
      }
    });

    AsyncStorage.getItem(PROJECT_IDEAS_STORAGE_KEY).then((raw) => {
      if (!raw) {
        return;
      }

      try {
        setProjectIdeas(JSON.parse(raw) as ProjectIdea[]);
      } catch {
        setProjectIdeas([]);
      }
    });

    AsyncStorage.getItem(OUTCOMES_STORAGE_KEY).then((raw) => {
      if (!raw) {
        return;
      }

      try {
        setOutcomes(JSON.parse(raw) as Outcome[]);
      } catch {
        setOutcomes([]);
      }
    });
  }, []);

  const persistIdeas = async (nextIdeas: Idea[]) => {
    setIdeas(nextIdeas);
    await AsyncStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(nextIdeas));
  };

  const persistTags = async (nextTags: Tag[]) => {
    setTags(nextTags);
    await AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(nextTags));
  };

  const persistIdeaTags = async (nextIdeaTags: IdeaTag[]) => {
    setIdeaTags(nextIdeaTags);
    await AsyncStorage.setItem(IDEA_TAGS_STORAGE_KEY, JSON.stringify(nextIdeaTags));
  };

  const persistProjects = async (nextProjects: Project[]) => {
    setProjects(nextProjects);
    await AsyncStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(nextProjects));
  };

  const persistProjectIdeas = async (nextProjectIdeas: ProjectIdea[]) => {
    setProjectIdeas(nextProjectIdeas);
    await AsyncStorage.setItem(PROJECT_IDEAS_STORAGE_KEY, JSON.stringify(nextProjectIdeas));
  };

  const persistOutcomes = async (nextOutcomes: Outcome[]) => {
    setOutcomes(nextOutcomes);
    await AsyncStorage.setItem(OUTCOMES_STORAGE_KEY, JSON.stringify(nextOutcomes));
  };

  const normalizeTagName = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

  const createOrReuseTags = async (rawNames: string[]) => {
    let nextTags = [...tags];
    const resultIds: string[] = [];

    rawNames
      .map((name) => name.trim().replace(/\s+/g, ' '))
      .filter(Boolean)
      .forEach((name) => {
        const existing = nextTags.find((tag) => normalizeTagName(tag.name) === normalizeTagName(name));

        if (existing) {
          resultIds.push(existing.id);
          return;
        }

        const tag: Tag = {
          id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          color: TAG_COLORS[nextTags.length % TAG_COLORS.length],
          isFavorite: false,
          created_at: new Date().toISOString(),
        };
        nextTags = [tag, ...nextTags];
        resultIds.push(tag.id);
      });

    if (nextTags.length !== tags.length) {
      await persistTags(nextTags);
    }

    return resultIds;
  };

  const setTagsForIdea = async (ideaId: string, tagIds: string[]) => {
    const uniqueTagIds = Array.from(new Set(tagIds));
    const nextIdeaTags = [
      ...ideaTags.filter((link) => link.idea_id !== ideaId),
      ...uniqueTagIds.map((tagId) => ({ idea_id: ideaId, tag_id: tagId })),
    ];

    await persistIdeaTags(nextIdeaTags);
  };

  const getTagsForIdea = (ideaId: string) => {
    const tagIds = ideaTags.filter((link) => link.idea_id === ideaId).map((link) => link.tag_id);
    return tags.filter((tag) => tagIds.includes(tag.id));
  };

  const getTagUsageCount = (tagId: string) => ideaTags.filter((link) => link.tag_id === tagId).length;

  const getIdeaTagIds = (ideaId: string) => ideaTags.filter((link) => link.idea_id === ideaId).map((link) => link.tag_id);

  const extractKeywords = (content: string) => {
    const words = content.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,}/g) ?? [];

    return Array.from(
      new Set(
        words
          .flatMap((word) => (word.length > 8 ? [word.slice(0, 6), word.slice(6, 12)] : [word]))
          .map((word) => word.toLowerCase()),
      ),
    );
  };

  const getRelatedIdeaCandidates = (content: string, tagIds: string[], excludeIdeaId: string | null) => {
    const keywords = extractKeywords(content);

    return ideas
      .filter((idea) => idea.id !== excludeIdeaId)
      .map((idea) => {
        const ideaTagIds = getIdeaTagIds(idea.id);
        const tagScore = ideaTagIds.filter((tagId) => tagIds.includes(tagId)).length;
        const keywordScore = keywords.filter((keyword) => idea.content.toLowerCase().includes(keyword)).length;

        return { idea, score: tagScore * 2 + keywordScore };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.idea.updated_at).getTime() - new Date(a.idea.updated_at).getTime())
      .slice(0, 4)
      .map((item) => item.idea);
  };

  const getRelatedIdeas = (idea: Idea) => ideas.filter((item) => idea.relatedIdeaIds.includes(item.id));

  const getProjectIdeas = (projectId: string) => {
    const ideaIds = projectIdeas.filter((link) => link.project_id === projectId).map((link) => link.idea_id);
    return ideas.filter((idea) => ideaIds.includes(idea.id));
  };

  const getProjectById = (projectId: string) => projects.find((project) => project.id === projectId) ?? null;

  const getProjectOutcome = (projectId: string) => outcomes.find((outcome) => outcome.project_id === projectId) ?? null;

  const getImpactForIdea = (ideaId: string) => {
    const linkedProjectIds = Array.from(
      new Set(projectIdeas.filter((link) => link.idea_id === ideaId).map((link) => link.project_id)),
    );
    const linkedProjects = projects.filter((project) => linkedProjectIds.includes(project.id));
    const lastUsedAt = linkedProjects
      .map((project) => project.updated_at)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    const completedProjectsCount = linkedProjects.filter((project) => outcomes.some((outcome) => outcome.project_id === project.id)).length;

    return {
      usedCount: linkedProjects.length,
      lastUsedAt,
      projects: linkedProjects,
      completedProjectsCount,
    };
  };

  const getCandyIdeas = () =>
    (ideas.length > 0 ? ideas : initialIdeas)
      .map((idea) => ({ idea, impact: getImpactForIdea(idea.id) }))
      .sort((a, b) => {
        if (b.impact.usedCount !== a.impact.usedCount) {
          return b.impact.usedCount - a.impact.usedCount;
        }

        return new Date(b.impact.lastUsedAt ?? b.idea.updated_at).getTime() - new Date(a.impact.lastUsedAt ?? a.idea.updated_at).getTime();
      })
      .slice(0, 16);

  const toggleSelectedTag = (tagId: string) => {
    setSelectedTagIds((current) => (current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]));
  };

  const addPendingTags = (value: string) => {
    const names = value
      .split(/[,，\s\n]+/)
      .map((name) => name.trim())
      .filter(Boolean);

    if (names.length === 0) {
      return;
    }

    setPendingTagNames((current) => {
      const existingNames = new Set([
        ...current.map((name) => normalizeTagName(name)),
        ...tags.map((tag) => normalizeTagName(tag.name)),
      ]);
      const nextPending = [...current];
      const reusedTagIds: string[] = [];

      names.forEach((name) => {
        const existingTag = tags.find((tag) => normalizeTagName(tag.name) === normalizeTagName(name));

        if (existingTag) {
          reusedTagIds.push(existingTag.id);
          return;
        }

        if (!existingNames.has(normalizeTagName(name))) {
          existingNames.add(normalizeTagName(name));
          nextPending.push(name);
        }
      });

      if (reusedTagIds.length > 0) {
        setSelectedTagIds((selectedIds) => Array.from(new Set([...selectedIds, ...reusedTagIds])));
      }

      return nextPending;
    });
  };

  const handleNewTagTextChange = (value: string) => {
    if (/[,，\s\n]/.test(value)) {
      addPendingTags(value);
      setNewTagText('');
      return;
    }

    setNewTagText(value);
  };

  const commitCurrentTagText = () => {
    addPendingTags(newTagText);
    setNewTagText('');
  };

  const removePendingTag = (name: string) => {
    setPendingTagNames((current) => current.filter((tagName) => normalizeTagName(tagName) !== normalizeTagName(name)));
  };

  const removeSelectedTag = (tagId: string) => {
    setSelectedTagIds((current) => current.filter((id) => id !== tagId));
  };

  const openDetail = (idea: Idea) => {
    setSelectedIdea(idea);
    setScreen('detail');
  };

  const closeIdeaDetail = () => {
    setSelectedIdea(null);
    setScreen('home');
  };

  const saveIdea = () => {
    const content = draft.trim();
    const title = titleDraft.trim();

    if (!content) {
      return;
    }

    const now = new Date().toISOString();
    if (editingIdeaId) {
      const nextIdeas = ideas.map((idea) =>
        idea.id === editingIdeaId
          ? {
              ...idea,
              title,
              content,
              updated_at: now,
              relatedIdeaIds: selectedRelatedIdeaIds,
            }
          : idea,
      );
      const updatedIdea = nextIdeas.find((idea) => idea.id === editingIdeaId) ?? null;

      persistIdeas(nextIdeas);
      setSelectedIdea(updatedIdea);
      setEditingIdeaId(null);
      setTitleDraft('');
      setDraft('');
      setScreen(updatedIdea ? 'detail' : 'home');
      setTagsForIdea(editingIdeaId, selectedTagIds);
      return;
    }

    const idea: Idea = {
      id: `idea-${Date.now()}`,
      title,
      content,
      created_at: now,
      updated_at: now,
      imageUri: undefined,
      relatedIdeaIds: [],
    };

    persistIdeas([idea, ...ideas]);
    setTagsForIdea(idea.id, selectedTagIds);
    setTitleDraft('');
    setDraft('');
    setSelectedTagIds([]);
    setNewTagText('');
    setScreen('home');
  };

  const startCreate = () => {
    setEditingIdeaId(null);
    setTitleDraft('');
    setDraft('');
    setSelectedTagIds([]);
    setNewTagText('');
    setPendingTagNames([]);
    setSelectedRelatedIdeaIds([]);
    setActiveTab('home');
    setScreen('create');
  };

  const startEdit = (idea: Idea) => {
    setEditingIdeaId(idea.id);
    setTitleDraft(idea.title ?? getIdeaTitle(idea));
    setDraft(idea.content);
    setSelectedTagIds(ideaTags.filter((link) => link.idea_id === idea.id).map((link) => link.tag_id));
    setNewTagText('');
    setPendingTagNames([]);
    setSelectedRelatedIdeaIds(idea.relatedIdeaIds);
    setActiveTab('home');
    setScreen('create');
  };

  const deleteIdea = (ideaId: string) => {
    const nextIdeas = ideas
      .filter((idea) => idea.id !== ideaId)
      .map((idea) => ({
        ...idea,
        relatedIdeaIds: idea.relatedIdeaIds.filter((relatedId) => relatedId !== ideaId),
      }));

    persistIdeas(nextIdeas);
    persistIdeaTags(ideaTags.filter((link) => link.idea_id !== ideaId));
    persistProjectIdeas(projectIdeas.filter((link) => link.idea_id !== ideaId));
    setSelectedIdea(null);
    setScreen('home');
  };

  const toggleRelatedIdea = (ideaId: string) => {
    setSelectedRelatedIdeaIds((current) =>
      current.includes(ideaId) ? current.filter((id) => id !== ideaId) : [...current, ideaId],
    );
  };

  const saveTagSelectionAndIdea = async () => {
    const manualNames = newTagText.trim() ? [newTagText.trim()] : [];
    const createdTagIds = await createOrReuseTags([...pendingTagNames, ...manualNames]);
    setSelectedTagIds((current) => Array.from(new Set([...current, ...createdTagIds])));
    saveIdeaWithTagIds(Array.from(new Set([...selectedTagIds, ...createdTagIds])));
  };

  const saveIdeaWithTagIds = (tagIds: string[]) => {
    const content = draft.trim();
    const title = titleDraft.trim();

    if (!content) {
      return;
    }

    const now = new Date().toISOString();

    if (editingIdeaId) {
      const nextIdeas = ideas.map((idea) =>
        idea.id === editingIdeaId
          ? {
              ...idea,
              title,
              content,
              updated_at: now,
            }
          : idea,
      );
      const updatedIdea = nextIdeas.find((idea) => idea.id === editingIdeaId) ?? null;
      const nextIdeaTags = [
        ...ideaTags.filter((link) => link.idea_id !== editingIdeaId),
        ...Array.from(new Set(tagIds)).map((tagId) => ({ idea_id: editingIdeaId, tag_id: tagId })),
      ];

      persistIdeas(nextIdeas);
      persistIdeaTags(nextIdeaTags);
      setSelectedIdea(updatedIdea);
      setEditingIdeaId(null);
      setTitleDraft('');
      setDraft('');
      setSelectedTagIds([]);
      setNewTagText('');
      setPendingTagNames([]);
      setSelectedRelatedIdeaIds([]);
      setScreen(updatedIdea ? 'detail' : 'home');
      return;
    }

    const idea: Idea = {
      id: `idea-${Date.now()}`,
      title,
      content,
      created_at: now,
      updated_at: now,
      imageUri: undefined,
      relatedIdeaIds: selectedRelatedIdeaIds,
    };
    const nextIdeaTags = [
      ...ideaTags,
      ...Array.from(new Set(tagIds)).map((tagId) => ({ idea_id: idea.id, tag_id: tagId })),
    ];

    persistIdeas([idea, ...ideas]);
    persistIdeaTags(nextIdeaTags);
    setTitleDraft('');
    setDraft('');
    setSelectedTagIds([]);
    setNewTagText('');
    setPendingTagNames([]);
    setSelectedRelatedIdeaIds([]);
    setScreen('home');
  };

  const toggleFavoriteTag = (tagId: string) => {
    persistTags(tags.map((tag) => (tag.id === tagId ? { ...tag, isFavorite: !tag.isFavorite } : tag)));
  };

  const renameTag = (tagId: string, nextName: string) => {
    const name = nextName.trim().replace(/\s+/g, ' ');

    if (!name) {
      return;
    }

    const duplicated = tags.some((tag) => tag.id !== tagId && normalizeTagName(tag.name) === normalizeTagName(name));

    if (duplicated) {
      Alert.alert('标签已存在', '这个食材标签已经在灵感餐桌上了。');
      return;
    }

    persistTags(tags.map((tag) => (tag.id === tagId ? { ...tag, name } : tag)));
  };

  const deleteTag = (tagId: string) => {
    Alert.alert('删除标签', '删除标签不会删除灵感，只会移除这些灵感上的该标签。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          persistTags(tags.filter((tag) => tag.id !== tagId));
          persistIdeaTags(ideaTags.filter((link) => link.tag_id !== tagId));
        },
      },
    ]);
  };

  const startCreateProject = () => {
    setProjectTitleDraft('');
    setProjectDescriptionDraft('');
    setSelectedProject(null);
    setActiveTab('studio');
    setScreen('projectCreate');
  };

  const saveProject = () => {
    const title = projectTitleDraft.trim();

    if (!title) {
      return;
    }

    const now = new Date().toISOString();
    const project: Project = {
      id: `project-${Date.now()}`,
      title,
      description: projectDescriptionDraft.trim(),
      draftContent: '',
      status: 'draft',
      created_at: now,
      updated_at: now,
    };

    persistProjects([project, ...projects]);
    setProjectDraftContent('');
    setProjectTitleDraft('');
    setProjectDescriptionDraft('');
    setSelectedProject(null);
    setScreen('home');
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
    setProjectTitleDraft(project.title);
    setProjectDescriptionDraft(project.description);
    setProjectDraftContent(project.draftContent);
    setActiveTab('studio');
    setScreen('projectDetail');
  };

  const updateSelectedProject = (patch: Partial<Project>) => {
    if (!selectedProject) {
      return null;
    }

    const updatedProject = {
      ...selectedProject,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    const nextProjects = projects.map((project) => (project.id === selectedProject.id ? updatedProject : project));

    persistProjects(nextProjects);
    setSelectedProject(updatedProject);
    return updatedProject;
  };

  const saveProjectDraft = () => {
    updateSelectedProject({ draftContent: projectDraftContent });
  };

  const saveProjectMeta = () => {
    const title = projectTitleDraft.trim();

    if (!title) {
      return;
    }

    updateSelectedProject({
      title,
      description: projectDescriptionDraft.trim(),
      draftContent: projectDraftContent,
    });
  };

  const addIdeaToProject = (ideaId: string) => {
    if (!selectedProject || projectIdeas.some((link) => link.project_id === selectedProject.id && link.idea_id === ideaId)) {
      return;
    }

    persistProjectIdeas([...projectIdeas, { project_id: selectedProject.id, idea_id: ideaId }]);
    updateSelectedProject({});
  };

  const removeIdeaFromProject = (ideaId: string) => {
    if (!selectedProject) {
      return;
    }

    persistProjectIdeas(projectIdeas.filter((link) => !(link.project_id === selectedProject.id && link.idea_id === ideaId)));
    updateSelectedProject({});
  };

  const changeProjectStatus = (status: ProjectStatus) => {
    if (!selectedProject) {
      return;
    }

    if (status === 'completed') {
      setOutcomeType(getProjectOutcome(selectedProject.id)?.type ?? '文章');
      setOutcomeDescription(getProjectOutcome(selectedProject.id)?.resultDescription ?? '');
      setScreen('outcomeForm');
      return;
    }

    updateSelectedProject({ status });
  };

  const saveOutcomeForProject = () => {
    if (!selectedProject) {
      return;
    }

    const now = new Date().toISOString();
    const existingOutcome = getProjectOutcome(selectedProject.id);
    const outcome: Outcome = existingOutcome
      ? {
          ...existingOutcome,
          type: outcomeType,
          resultDescription: outcomeDescription.trim(),
          completed_at: now,
        }
      : {
          id: `outcome-${Date.now()}`,
          project_id: selectedProject.id,
          type: outcomeType,
          resultDescription: outcomeDescription.trim(),
          completed_at: now,
        };
    const nextOutcomes = existingOutcome
      ? outcomes.map((item) => (item.id === existingOutcome.id ? outcome : item))
      : [outcome, ...outcomes];
    const updatedProject = updateSelectedProject({ status: 'completed' });

    persistOutcomes(nextOutcomes);
    setSelectedProject(null);
    setSelectedOutcome(outcome);
    setOutcomeDescription('');
    setOutcomeType('文章');
    setActiveTab('works');
    setScreen('home');
  };

  const openOutcome = (outcome: Outcome) => {
    setSelectedOutcome(outcome);
    setActiveTab('works');
    setScreen('outcomeDetail');
  };

  const inDateRange = (value: string, startDate: string, endDate: string) => {
    const time = new Date(value).getTime();
    const start = startDate.trim() ? new Date(`${startDate.trim()}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const end = endDate.trim() ? new Date(`${endDate.trim()}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;

    return time >= start && time <= end;
  };

  const getExportTagNamesForIdea = (ideaId: string) => getTagsForIdea(ideaId).map((tag) => tag.name);

  const projectMatchesTags = (projectId: string, tagIds: string[]) => {
    if (tagIds.length === 0) {
      return true;
    }

    return getProjectIdeas(projectId).some((idea) => getTagsForIdea(idea.id).some((tag) => tagIds.includes(tag.id)));
  };

  const buildExportText = ({ type, tagIds, startDate, endDate }: ExportOptions) => {
    if (type === 'ideas') {
      return ideas
        .filter((idea) => inDateRange(idea.created_at, startDate, endDate))
        .filter((idea) => tagIds.length === 0 || getTagsForIdea(idea.id).some((tag) => tagIds.includes(tag.id)))
        .map((idea) =>
          [
            `标题：${getIdeaTitle(idea)}`,
            `时间：${formatTime(idea.created_at)}`,
            `标签：${getExportTagNamesForIdea(idea.id).join('、') || '无'}`,
            `内容：${idea.content}`,
          ].join('\n'),
        )
        .join('\n\n-------------------\n\n');
    }

    if (type === 'projects') {
      return projects
        .filter((project) => inDateRange(project.created_at, startDate, endDate))
        .filter((project) => projectMatchesTags(project.id, tagIds))
        .map((project) =>
          [
            `标题：${project.title}`,
            `时间：${formatTime(project.created_at)}`,
            `标签：${Array.from(new Set(getProjectIdeas(project.id).flatMap((idea) => getExportTagNamesForIdea(idea.id)))).join('、') || '无'}`,
            `内容：${project.description || '无说明'}\n\n${project.draftContent || '无草稿'}`,
          ].join('\n'),
        )
        .join('\n\n-------------------\n\n');
    }

    return outcomes
      .filter((outcome) => inDateRange(outcome.completed_at, startDate, endDate))
      .filter((outcome) => projectMatchesTags(outcome.project_id, tagIds))
      .map((outcome) => {
        const project = getProjectById(outcome.project_id);

        return [
          `标题：${project?.title ?? '未知项目'}`,
          `时间：${formatTime(outcome.completed_at)}`,
          `标签：${Array.from(new Set(getProjectIdeas(outcome.project_id).flatMap((idea) => getExportTagNamesForIdea(idea.id)))).join('、') || '无'}`,
          `内容：${outcome.type}\n${outcome.resultDescription || '无转化说明'}`,
        ].join('\n');
      })
      .join('\n\n-------------------\n\n');
  };

  const exportContent = async (options: ExportOptions) => {
    const text = buildExportText(options) || '没有符合条件的内容。';
    const fileName = `pieces-export-${options.type}-${Date.now()}.txt`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('已生成导出文件', fileUri);
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/plain',
      dialogTitle: '导出内容',
      UTI: 'public.plain-text',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#F9F2EF" />
      <View style={styles.shell}>
        {activeTab === 'home' && screen === 'home' ? (
          <HomeView
            ideas={(ideas.length > 0 ? ideas : initialIdeas).slice(0, 4)}
            ideasCount={ideas.length > 0 ? ideas.length : initialIdeas.length}
            projectsCount={projects.length}
            outcomesCount={outcomes.length}
            getTagsForIdea={getTagsForIdea}
            getImpactForIdea={getImpactForIdea}
            candyIdeas={getCandyIdeas()}
            onCreate={startCreate}
            onOpenDetail={openDetail}
          />
        ) : null}
        {activeTab === 'home' && screen === 'create' ? (
          <CreateView
            titleValue={titleDraft}
            value={draft}
            isEditing={Boolean(editingIdeaId)}
            tags={tags}
            selectedTagIds={selectedTagIds}
            pendingTagNames={pendingTagNames}
            newTagText={newTagText}
            relatedCandidates={getRelatedIdeaCandidates(draft, selectedTagIds, editingIdeaId)}
            selectedRelatedIdeaIds={selectedRelatedIdeaIds}
            onTitleChange={setTitleDraft}
            onChange={setDraft}
            onToggleTag={toggleSelectedTag}
            onRemoveSelectedTag={removeSelectedTag}
            onRemovePendingTag={removePendingTag}
            onNewTagTextChange={handleNewTagTextChange}
            onCommitTagText={commitCurrentTagText}
            onToggleRelatedIdea={toggleRelatedIdea}
            onSave={saveTagSelectionAndIdea}
            onBack={() => {
              setEditingIdeaId(null);
              setTitleDraft('');
              setDraft('');
              setSelectedTagIds([]);
              setNewTagText('');
              setPendingTagNames([]);
              setSelectedRelatedIdeaIds([]);
              setScreen('home');
            }}
          />
        ) : null}
        {screen === 'detail' && selectedIdea ? (
          <DetailView
            idea={selectedIdea}
            tags={getTagsForIdea(selectedIdea.id)}
            relatedIdeas={getRelatedIdeas(selectedIdea)}
            impact={getImpactForIdea(selectedIdea.id)}
            onBack={closeIdeaDetail}
            onEdit={startEdit}
            onDelete={deleteIdea}
            onOpenRelated={openDetail}
          />
        ) : null}
        {activeTab === 'ideas' && screen === 'home' ? (
          <IdeasListView
            ideas={ideas}
            tags={tags}
            getTagsForIdea={getTagsForIdea}
            getUsageCount={getTagUsageCount}
            getImpactForIdea={getImpactForIdea}
            onOpenDetail={openDetail}
            onCreate={startCreate}
          />
        ) : null}
        {activeTab === 'studio' && screen === 'home' ? (
          <StudioView projects={projects} outcomes={outcomes} onCreate={startCreateProject} onOpenProject={openProject} />
        ) : null}
        {activeTab === 'studio' && screen === 'projectCreate' ? (
          <ProjectFormView
            titleValue={projectTitleDraft}
            descriptionValue={projectDescriptionDraft}
            onTitleChange={setProjectTitleDraft}
            onDescriptionChange={setProjectDescriptionDraft}
            onSave={saveProject}
            onBack={() => setScreen('home')}
          />
        ) : null}
        {activeTab === 'studio' && screen === 'projectDetail' && selectedProject ? (
          <ProjectDetailView
            project={getProjectById(selectedProject.id) ?? selectedProject}
            linkedIdeas={getProjectIdeas(selectedProject.id)}
            allIdeas={ideas}
            getTagsForIdea={getTagsForIdea}
            titleValue={projectTitleDraft}
            descriptionValue={projectDescriptionDraft}
            draftValue={projectDraftContent}
            onTitleChange={setProjectTitleDraft}
            onDescriptionChange={setProjectDescriptionDraft}
            onDraftChange={setProjectDraftContent}
            onSaveProject={saveProjectMeta}
            onChangeStatus={changeProjectStatus}
            onAddIdea={addIdeaToProject}
            onRemoveIdea={removeIdeaFromProject}
            onOpenIdea={openDetail}
            onBack={() => {
              setSelectedProject(null);
              setScreen('home');
            }}
          />
        ) : null}
        {activeTab === 'studio' && screen === 'outcomeForm' && selectedProject ? (
          <OutcomeFormView
            project={selectedProject}
            typeValue={outcomeType}
            descriptionValue={outcomeDescription}
            onTypeChange={setOutcomeType}
            onDescriptionChange={setOutcomeDescription}
            onSave={saveOutcomeForProject}
            onBack={() => setScreen('projectDetail')}
          />
        ) : null}
        {activeTab === 'works' && screen === 'home' ? (
          <WorksView outcomes={outcomes} projects={projects} onOpenOutcome={openOutcome} />
        ) : null}
        {activeTab === 'works' && screen === 'outcomeDetail' && selectedOutcome ? (
          <OutcomeDetailView
            outcome={selectedOutcome}
            project={getProjectById(selectedOutcome.project_id)}
            linkedIdeas={getProjectIdeas(selectedOutcome.project_id)}
            onOpenIdea={openDetail}
            onBack={() => setScreen('home')}
          />
        ) : null}
        {activeTab === 'profile' && screen === 'home' ? (
          <ProfileView
            tags={tags}
            impactIdeaCount={ideas.filter((idea) => getImpactForIdea(idea.id).usedCount > 1).length}
            getUsageCount={getTagUsageCount}
            onExport={exportContent}
            onCreateTag={async (name) => {
              await createOrReuseTags([name]);
            }}
            onToggleFavorite={toggleFavoriteTag}
            onRenameTag={renameTag}
            onDeleteTag={deleteTag}
          />
        ) : null}
        {activeTab !== 'home' && activeTab !== 'ideas' && activeTab !== 'profile' && activeTab !== 'studio' && activeTab !== 'works' ? (
          <PlaceholderView label={tabs.find((tab) => tab.key === activeTab)?.label ?? ''} />
        ) : null}

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                onPress={() => {
                  setActiveTab(tab.key);
                  setScreen('home');
                  setSelectedIdea(null);
                  setSelectedProject(null);
                  setSelectedOutcome(null);
                }}
                style={styles.tabItem}
              >
                <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

function HomeView({
  ideas,
  ideasCount,
  projectsCount,
  outcomesCount,
  getTagsForIdea,
  getImpactForIdea,
  candyIdeas,
  onCreate,
  onOpenDetail,
}: {
  ideas: Idea[];
  ideasCount: number;
  projectsCount: number;
  outcomesCount: number;
  getTagsForIdea: (ideaId: string) => Tag[];
  getImpactForIdea: (ideaId: string) => { usedCount: number };
  candyIdeas: Array<{ idea: Idea; impact: { usedCount: number; lastUsedAt?: string } }>;
  onCreate: () => void;
  onOpenDetail: (idea: Idea) => void;
}) {
  const cardTones = [styles.cardTone0, styles.cardTone1, styles.cardTone2];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>个人创作系统</Text>
        <View style={styles.homeHeader}>
          <View style={styles.homeTitleBlock}>
            <Text style={styles.greeting}>今天又发现啥新鲜事儿啦？</Text>
            <Text style={styles.brandTitle}>PIECES</Text>
          </View>
          <View style={styles.avatarSlot} />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>最近灵感</Text>
          <Text style={styles.sectionHint} />
        </View>

        <View style={styles.list}>
          {ideas.map((idea, index) => (
            <Pressable
              key={idea.id}
              accessibilityRole="button"
              onPress={() => onOpenDetail(idea)}
              style={({ pressed }) => [styles.card, cardTones[index % cardTones.length], pressed ? styles.cardPressed : null]}
            >
              <Text style={styles.cardTitle} numberOfLines={1}>
                {getIdeaTitle(idea)}
              </Text>
              <Text style={styles.cardText} numberOfLines={3}>
                {idea.content}
              </Text>
              <View style={styles.tagRow}>
                {getTagsForIdea(idea.id).length > 0 ? (
                  getTagsForIdea(idea.id)
                    .slice(0, 3)
                    .map((tag) => <TagChip key={tag.id} tag={tag} />)
                ) : (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagText}>标签预留</Text>
                  </View>
                )}
                <View style={styles.tagPillSoft}>
                  <Text style={styles.tagText}>被使用 {getImpactForIdea(idea.id).usedCount} 次</Text>
                </View>
              </View>
              <Text style={styles.time}>{formatTime(idea.created_at)}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.metricsRow}>
          <MetricCard label="当前灵感" value={String(ideasCount)} tone="orange" />
          <MetricCard label="创作项目" value={String(projectsCount)} tone="green" />
          <MetricCard label="成果数" value={String(outcomesCount)} tone="blue" />
        </View>

        <Text style={styles.insightText}>这些事，你一直记得</Text>

        <View style={styles.ipPanel}>
          <View style={styles.ipCopy}>
            <Text style={styles.ipTitle}>糖果罐</Text>
            <Text style={styles.ipText}>你的想法正在慢慢发酵，有些灵感已经被反复使用了。</Text>
          </View>
          <View style={styles.ipBlankPlaceholder} />
        </View>
      </ScrollView>

      <Pressable accessibilityRole="button" onPress={onCreate} style={styles.fab}>
        <Text style={styles.fabPlus}>+</Text>
        <Text style={styles.fabText}>新增灵感</Text>
      </Pressable>
    </View>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'orange' | 'green' | 'blue' }) {
  return (
    <View style={[styles.metricCard, styles[`${tone}Metric`]]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function TagChip({ tag, selected = false, count, onPress }: { tag: Tag; selected?: boolean; count?: number; onPress?: () => void }) {
  const content = (
    <>
      <Text style={styles.tagText}>{tag.isFavorite ? '★ ' : ''}{tag.name}</Text>
      {typeof count === 'number' ? <Text style={styles.tagCount}>{count}</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={[styles.tagChipBlock, { backgroundColor: tag.color }, selected ? styles.tagChipSelected : null]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.tagChipBlock, { backgroundColor: tag.color }]}>{content}</View>;
}

function RemovableTagChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View style={styles.removableTag}>
      <Text style={styles.tagText}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={onRemove} hitSlop={8}>
        <Text style={styles.removeTagText}>×</Text>
      </Pressable>
    </View>
  );
}

function CreateView({
  titleValue,
  value,
  isEditing,
  tags,
  selectedTagIds,
  pendingTagNames,
  newTagText,
  relatedCandidates,
  selectedRelatedIdeaIds,
  onTitleChange,
  onChange,
  onToggleTag,
  onRemoveSelectedTag,
  onRemovePendingTag,
  onNewTagTextChange,
  onCommitTagText,
  onToggleRelatedIdea,
  onSave,
  onBack,
}: {
  titleValue: string;
  value: string;
  isEditing: boolean;
  tags: Tag[];
  selectedTagIds: string[];
  pendingTagNames: string[];
  newTagText: string;
  relatedCandidates: Idea[];
  selectedRelatedIdeaIds: string[];
  onTitleChange: (value: string) => void;
  onChange: (value: string) => void;
  onToggleTag: (tagId: string) => void;
  onRemoveSelectedTag: (tagId: string) => void;
  onRemovePendingTag: (name: string) => void;
  onNewTagTextChange: (value: string) => void;
  onCommitTagText: () => void;
  onToggleRelatedIdea: (ideaId: string) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  const favoriteTags = tags.filter((tag) => tag.isFavorite);
  const regularTags = tags.filter((tag) => !tag.isFavorite);
  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const suggestions = newTagText.trim()
    ? tags
        .filter((tag) => tag.name.toLowerCase().includes(newTagText.trim().toLowerCase()))
        .filter((tag) => !selectedTagIds.includes(tag.id))
        .slice(0, 4)
    : [];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>返回</Text>
        </Pressable>

        <Text style={styles.title}>{isEditing ? '编辑灵感' : '新增灵感'}</Text>
        <Text style={styles.subtitle}>给这口灵感起个名字，再把它放进灵感罐。</Text>

        <TextInput
          value={titleValue}
          onChangeText={onTitleChange}
          placeholder="给这口灵感起个名字"
          placeholderTextColor="#9B8E88"
          style={styles.titleInput}
        />

        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="记录一口今天的想法"
          placeholderTextColor="#9B8E88"
          multiline
          textAlignVertical="top"
          style={styles.input}
        />

        <Text style={styles.formLabel}>常用标签</Text>
        <View style={styles.tagRow}>
          {favoriteTags.length > 0 ? (
            favoriteTags.map((tag) => (
              <TagChip key={tag.id} tag={tag} selected={selectedTagIds.includes(tag.id)} onPress={() => onToggleTag(tag.id)} />
            ))
          ) : (
            <Text style={styles.emptyHint}>还没有常用标签，可以先输入新标签。</Text>
          )}
        </View>

        <Text style={styles.formLabel}>已有标签</Text>
        <View style={styles.tagRow}>
          {regularTags.length > 0 ? (
            regularTags.map((tag) => (
              <TagChip key={tag.id} tag={tag} selected={selectedTagIds.includes(tag.id)} onPress={() => onToggleTag(tag.id)} />
            ))
          ) : (
            <Text style={styles.emptyHint}>暂无已有标签。</Text>
          )}
        </View>

        <Text style={styles.formLabel}>已选标签</Text>
        <View style={styles.tagRow}>
          {selectedTags.length > 0 || pendingTagNames.length > 0 ? (
            <>
              {selectedTags.map((tag) => (
                <RemovableTagChip key={tag.id} label={tag.name} onRemove={() => onRemoveSelectedTag(tag.id)} />
              ))}
              {pendingTagNames.map((name) => (
                <RemovableTagChip key={name} label={name} onRemove={() => onRemovePendingTag(name)} />
              ))}
            </>
          ) : (
            <Text style={styles.emptyHint}>还没有选择标签。</Text>
          )}
        </View>

        <TextInput
          value={newTagText}
          onChangeText={onNewTagTextChange}
          onSubmitEditing={onCommitTagText}
          blurOnSubmit={false}
          placeholder="输入标签，逗号/空格/回车生成"
          placeholderTextColor="#9B8E88"
          style={styles.tagInput}
        />

        {suggestions.length > 0 ? (
          <View style={styles.suggestionBox}>
            {suggestions.map((tag) => (
              <Pressable
                key={tag.id}
                accessibilityRole="button"
                onPress={() => onToggleTag(tag.id)}
                style={styles.suggestionItem}
              >
                <Text style={styles.suggestionText}>{tag.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.formLabel}>相关灵感</Text>
        <Text style={styles.emptyHint}>你之前也记录过类似的想法</Text>
        <View style={styles.relatedList}>
          {relatedCandidates.length > 0 ? (
            relatedCandidates.map((idea) => {
              const selected = selectedRelatedIdeaIds.includes(idea.id);

              return (
                <Pressable
                  key={idea.id}
                  accessibilityRole="button"
                  onPress={() => onToggleRelatedIdea(idea.id)}
                  style={[styles.relatedOption, selected ? styles.relatedOptionSelected : null]}
                >
                  <Text style={styles.relatedOptionText} numberOfLines={2}>
                    {idea.content}
                  </Text>
                  <Text style={styles.time}>{selected ? '已关联' : '轻点关联'}</Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.emptyHint}>暂时没有匹配到相近灵感，先把这口想法放进去。</Text>
          )}
        </View>

        <Pressable accessibilityRole="button" onPress={onSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{isEditing ? '保存修改' : '保存'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function DetailView({
  idea,
  tags,
  relatedIdeas,
  impact,
  onBack,
  onEdit,
  onDelete,
  onOpenRelated,
}: {
  idea: Idea;
  tags: Tag[];
  relatedIdeas: Idea[];
  impact: { usedCount: number; lastUsedAt?: string; projects: Project[]; completedProjectsCount: number };
  onBack: () => void;
  onEdit: (idea: Idea) => void;
  onDelete: (ideaId: string) => void;
  onOpenRelated: (idea: Idea) => void;
}) {
  const shareCardRef = useRef<View>(null);
  const [shareUri, setShareUri] = useState('');

  const generateShareCard = async () => {
    if (!shareCardRef.current) {
      return;
    }

    const uri = await captureRef(shareCardRef.current, {
      format: 'png',
      quality: 0.95,
    });

    setShareUri(uri);
  };

  const saveShareCard = async () => {
    if (!shareCardRef.current) {
      return;
    }

    const uri = shareUri || (await captureRef(shareCardRef.current, { format: 'png', quality: 0.95 }));
    const permission = await MediaLibrary.requestPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('需要相册权限', '允许访问相册后，才能保存灵感卡片。');
      return;
    }

    await MediaLibrary.saveToLibraryAsync(uri);
    setShareUri(uri);
    Alert.alert('已保存', '灵感卡片已经保存到相册。');
  };

  const shareIdeaCard = async () => {
    if (!shareCardRef.current) {
      return;
    }

    const uri = shareUri || (await captureRef(shareCardRef.current, { format: 'png', quality: 0.95 }));
    const available = await Sharing.isAvailableAsync();

    if (!available) {
      Alert.alert('暂时无法分享', '当前设备没有可用的系统分享能力。');
      return;
    }

    setShareUri(uri);
    await Sharing.shareAsync(uri);
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>返回</Text>
        </Pressable>

        <Text style={styles.title}>灵感详情</Text>
        <View style={styles.actionRow}>
          <Pressable accessibilityRole="button" onPress={() => onEdit(idea)} style={styles.smallButton}>
            <Text style={styles.smallButtonText}>编辑</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onDelete(idea.id)} style={[styles.smallButton, styles.deleteButton]}>
            <Text style={styles.smallButtonText}>删除</Text>
          </Pressable>
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{getIdeaTitle(idea)}</Text>
          <Text style={styles.detailText}>{idea.content}</Text>
          <Text style={styles.detailTime}>标签</Text>
          <View style={styles.tagRow}>
            {tags.length > 0 ? tags.map((tag) => <TagChip key={tag.id} tag={tag} />) : <Text style={styles.emptyHint}>暂未关联标签</Text>}
          </View>
          <Text style={styles.detailTime}>创建时间：{formatTime(idea.created_at)}</Text>
          <View style={styles.impactCard}>
            <Text style={styles.cardTitle}>Impact</Text>
            <Text style={styles.cardText}>被 {impact.usedCount} 个项目使用</Text>
            <Text style={styles.time}>最近使用：{impact.lastUsedAt ? formatTime(impact.lastUsedAt) : '还没有被项目使用'}</Text>
            <Text style={styles.time}>已转化成果：{impact.completedProjectsCount}</Text>
            <View style={styles.relatedList}>
              {impact.projects.length > 0 ? (
                impact.projects.map((project) => (
                  <View key={project.id} style={styles.relatedCard}>
                    <Text style={styles.relatedOptionText} numberOfLines={1}>
                      {project.title}
                    </Text>
                    <Text style={styles.time}>{getProjectStatusLabel(project.status)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyHint}>还没有进入任何创作项目。</Text>
              )}
            </View>
          </View>
          <Text style={styles.detailTime}>相关灵感</Text>
          <View style={styles.relatedList}>
            {relatedIdeas.length > 0 ? (
              relatedIdeas.map((relatedIdea) => (
                <Pressable
                  key={relatedIdea.id}
                  accessibilityRole="button"
                  onPress={() => onOpenRelated(relatedIdea)}
                  style={styles.relatedCard}
                >
                  <Text style={styles.relatedOptionText} numberOfLines={2}>
                    {relatedIdea.content}
                  </Text>
                  <Text style={styles.time}>{formatTime(relatedIdea.updated_at)}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyHint}>暂未关联其他灵感。</Text>
            )}
          </View>
          <Text style={styles.detailTime}>被哪些项目使用：{impact.projects.length > 0 ? '见 Impact' : '暂无'}</Text>
          <View ref={shareCardRef} collapsable={false} style={styles.ideaShareCard}>
            <View style={styles.shareLogoSlot}>
              <Text style={styles.shareLogoText}>PIECES</Text>
            </View>
            <Text style={styles.shareCardTitle}>{getIdeaTitle(idea)}</Text>
            <Text style={styles.shareCardBody}>{idea.content}</Text>
            <View style={styles.tagRow}>
              {tags.length > 0 ? tags.slice(0, 4).map((tag) => <TagChip key={tag.id} tag={tag} />) : null}
            </View>
            <Text style={styles.time}>{formatTime(idea.created_at)} · 记录一口今天的想法</Text>
          </View>
          <View style={styles.shareActionRow}>
            <Pressable accessibilityRole="button" onPress={generateShareCard} style={styles.sharePlaceholder}>
              <Text style={styles.sharePlaceholderText}>生成卡片</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={saveShareCard} style={styles.sharePlaceholder}>
              <Text style={styles.sharePlaceholderText}>保存图片</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={shareIdeaCard} style={styles.sharePlaceholder}>
              <Text style={styles.sharePlaceholderText}>分享</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function IdeasListView({
  ideas,
  tags,
  getTagsForIdea,
  getUsageCount,
  getImpactForIdea,
  onOpenDetail,
  onCreate,
}: {
  ideas: Idea[];
  tags: Tag[];
  getTagsForIdea: (ideaId: string) => Tag[];
  getUsageCount: (tagId: string) => number;
  getImpactForIdea: (ideaId: string) => { usedCount: number };
  onOpenDetail: (idea: Idea) => void;
  onCreate: () => void;
}) {
  const [selectedFilterTagId, setSelectedFilterTagId] = useState<string | null>(null);
  const menuTags = tags.filter((tag) => tag.isFavorite || getUsageCount(tag.id) > 0);
  const filteredIdeas = ideas
    .filter((idea) => !selectedFilterTagId || getTagsForIdea(idea.id).some((tag) => tag.id === selectedFilterTagId))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>灵感库</Text>
        <Text style={styles.subtitle}>等待烹饪......</Text>

        <View style={styles.libraryLayout}>
          <View style={styles.tagSideMenu}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedFilterTagId(null)}
              style={[styles.sideMenuItem, selectedFilterTagId === null ? styles.sideMenuItemActive : null]}
            >
              <Text style={styles.sideMenuText}>全部</Text>
              <Text style={styles.sideMenuCount}>{ideas.length}</Text>
            </Pressable>
            {menuTags.map((tag) => (
              <Pressable
                key={tag.id}
                accessibilityRole="button"
                onPress={() => setSelectedFilterTagId(tag.id)}
                style={[styles.sideMenuItem, selectedFilterTagId === tag.id ? styles.sideMenuItemActive : null]}
              >
                <Text style={styles.sideMenuText} numberOfLines={1}>
                  {tag.isFavorite ? '★ ' : ''}
                  {tag.name}
                </Text>
                <Text style={styles.sideMenuCount}>{getUsageCount(tag.id)}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.libraryList}>
            {filteredIdeas.length > 0 ? (
              filteredIdeas.map((idea, index) => (
                <Pressable
                  key={idea.id}
                  accessibilityRole="button"
                  onPress={() => onOpenDetail(idea)}
                  style={({ pressed }) => [
                    styles.libraryCard,
                    index % 2 === 0 ? styles.cardTone0 : styles.cardTone3,
                    pressed ? styles.cardPressed : null,
                  ]}
                >
                  <Text style={styles.libraryCardTitle} numberOfLines={1}>
                    {getIdeaTitle(idea)}
                  </Text>
                  <Text style={styles.libraryCardText} numberOfLines={3}>
                    {idea.content}
                  </Text>
                  <View style={styles.tagRow}>
                    {getTagsForIdea(idea.id).length > 0 ? (
                      getTagsForIdea(idea.id).map((tag) => <TagChip key={tag.id} tag={tag} />)
                    ) : (
                      <Text style={styles.emptyHint}>还没有食材标签</Text>
                    )}
                  </View>
                  <Text style={styles.time}>更新于：{formatTime(idea.updated_at)} · 被使用 {getImpactForIdea(idea.id).usedCount} 次</Text>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>这里还没有灵感</Text>
                <Text style={styles.emptyHint}>换个标签看看，或者先记录一口今天的想法。</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Pressable accessibilityRole="button" onPress={onCreate} style={styles.fab}>
        <Text style={styles.fabPlus}>+</Text>
        <Text style={styles.fabText}>新增灵感</Text>
      </Pressable>
    </View>
  );
}

function StudioView({
  projects,
  outcomes,
  onCreate,
  onOpenProject,
}: {
  projects: Project[];
  outcomes: Outcome[];
  onCreate: () => void;
  onOpenProject: (project: Project) => void;
}) {
  const sortedProjects = projects
    .filter((project) => project.status !== 'completed')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>创作区</Text>
        <Text style={styles.subtitle}>恭喜你！拥有了创作精品和制作垃圾的自由！</Text>

        <View style={styles.list}>
          {sortedProjects.length > 0 ? (
            sortedProjects.map((project, index) => (
              <Pressable
                key={project.id}
                accessibilityRole="button"
                onPress={() => onOpenProject(project)}
                style={({ pressed }) => [
                  styles.projectCard,
                  index % 2 === 0 ? styles.cardTone1 : styles.cardTone0,
                  pressed ? styles.cardPressed : null,
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {project.title}
                  </Text>
                  <StatusPill status={project.status} />
                </View>
                <Text style={styles.cardText} numberOfLines={2}>
                  {project.description || '还没有写创作说明。'}
                </Text>
                <Text style={styles.time}>
                  更新于 {formatTime(project.updated_at)}
                  {outcomes.some((outcome) => outcome.project_id === project.id) ? ' · 已进入灵感小窝' : ''}
                </Text>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>还没有创作项目</Text>
              <Text style={styles.emptyHint}>先创建一个小盘子，把想法放进去慢慢做。</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable accessibilityRole="button" onPress={onCreate} style={styles.fab}>
        <Text style={styles.fabPlus}>+</Text>
        <Text style={styles.fabText}>新建项目</Text>
      </Pressable>
    </View>
  );
}

function ProjectFormView({
  titleValue,
  descriptionValue,
  onTitleChange,
  onDescriptionChange,
  onSave,
  onBack,
}: {
  titleValue: string;
  descriptionValue: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>返回</Text>
        </Pressable>
        <Text style={styles.title}>新建项目</Text>
        <Text style={styles.subtitle}>给这盘创作起个名字。</Text>
        <TextInput
          value={titleValue}
          onChangeText={onTitleChange}
          placeholder="项目标题"
          placeholderTextColor="#9B8E88"
          style={styles.titleInput}
        />
        <TextInput
          value={descriptionValue}
          onChangeText={onDescriptionChange}
          placeholder="它大概想变成什么？"
          placeholderTextColor="#9B8E88"
          multiline
          textAlignVertical="top"
          style={styles.input}
        />
        <Pressable accessibilityRole="button" onPress={onSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>保存项目</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ProjectDetailView({
  project,
  linkedIdeas,
  allIdeas,
  getTagsForIdea,
  titleValue,
  descriptionValue,
  draftValue,
  onTitleChange,
  onDescriptionChange,
  onDraftChange,
  onSaveProject,
  onChangeStatus,
  onAddIdea,
  onRemoveIdea,
  onOpenIdea,
  onBack,
}: {
  project: Project;
  linkedIdeas: Idea[];
  allIdeas: Idea[];
  getTagsForIdea: (ideaId: string) => Tag[];
  titleValue: string;
  descriptionValue: string;
  draftValue: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDraftChange: (value: string) => void;
  onSaveProject: () => void;
  onChangeStatus: (status: ProjectStatus) => void;
  onAddIdea: (ideaId: string) => void;
  onRemoveIdea: (ideaId: string) => void;
  onOpenIdea: (idea: Idea) => void;
  onBack: () => void;
}) {
  const linkedIdeaIds = linkedIdeas.map((idea) => idea.id);
  const visibleIdeas = allIdeas.slice(0, 10);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>返回</Text>
        </Pressable>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.title}>{project.title}</Text>
          <StatusPill status={project.status} />
        </View>
        <Text style={styles.subtitle}>{project.description || '这盘创作还没有说明。'}</Text>

        <Text style={styles.formLabel}>项目信息</Text>
        <TextInput
          value={titleValue}
          onChangeText={onTitleChange}
          placeholder="项目标题"
          placeholderTextColor="#9B8E88"
          style={styles.titleInput}
        />
        <TextInput
          value={descriptionValue}
          onChangeText={onDescriptionChange}
          placeholder="项目说明"
          placeholderTextColor="#9B8E88"
          multiline
          textAlignVertical="top"
          style={styles.compactInput}
        />
        <Text style={styles.formLabel}>项目状态</Text>
        <View style={styles.statusRow}>
          {(['draft', 'in_progress', 'completed'] as ProjectStatus[]).map((status) => (
            <Pressable
              key={status}
              accessibilityRole="button"
              onPress={() => onChangeStatus(status)}
              style={[styles.statusButton, project.status === status ? styles.statusButtonActive : null]}
            >
              <Text style={styles.statusButtonText}>{getProjectStatusLabel(status)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.formLabel}>创作草稿</Text>
        <TextInput
          value={draftValue}
          onChangeText={onDraftChange}
          placeholder="把项目里的段落、脚本、想法先放在这里"
          placeholderTextColor="#9B8E88"
          multiline
          textAlignVertical="top"
          style={styles.input}
        />
        <Pressable accessibilityRole="button" onPress={onSaveProject} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>保存项目</Text>
        </Pressable>

        <Text style={styles.formLabel}>已放入项目的灵感</Text>
        <View style={styles.relatedList}>
          {linkedIdeas.length > 0 ? (
            linkedIdeas.map((idea) => (
              <View key={idea.id} style={styles.projectIdeaCard}>
                <Pressable accessibilityRole="button" onPress={() => onOpenIdea(idea)}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {getIdeaTitle(idea)}
                  </Text>
                  <Text style={styles.cardText} numberOfLines={3}>
                    {idea.content}
                  </Text>
                  <View style={styles.tagRow}>
                    {getTagsForIdea(idea.id).slice(0, 3).map((tag) => <TagChip key={tag.id} tag={tag} />)}
                  </View>
                  <Text style={styles.time}>{formatTime(idea.created_at)}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => onRemoveIdea(idea.id)} style={styles.manageButtonSoft}>
                  <Text style={styles.manageButtonSoftText}>移除灵感</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.emptyHint}>还没有放入灵感。</Text>
          )}
        </View>

        <Text style={styles.formLabel}>从灵感库添加</Text>
        <View style={styles.relatedList}>
          {visibleIdeas.length > 0 ? (
            visibleIdeas.map((idea) => {
              const linked = linkedIdeaIds.includes(idea.id);

              return (
              <Pressable
                key={idea.id}
                accessibilityRole="button"
                disabled={linked}
                onPress={() => onAddIdea(idea.id)}
                style={[styles.projectIdeaCard, linked ? styles.ideaCardDisabled : null]}
              >
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {getIdeaTitle(idea)}
                </Text>
                <Text style={styles.cardText} numberOfLines={3}>
                  {idea.content}
                </Text>
                <View style={styles.tagRow}>
                  {getTagsForIdea(idea.id).slice(0, 3).map((tag) => <TagChip key={tag.id} tag={tag} />)}
                </View>
                <Text style={styles.time}>{formatTime(idea.created_at)} · {linked ? '已加入' : '轻点放入项目'}</Text>
              </Pressable>
            );
            })
          ) : (
            <Text style={styles.emptyHint}>当前没有可添加的灵感。</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function OutcomeFormView({
  project,
  typeValue,
  descriptionValue,
  onTypeChange,
  onDescriptionChange,
  onSave,
  onBack,
}: {
  project: Project;
  typeValue: OutcomeType;
  descriptionValue: string;
  onTypeChange: (value: OutcomeType) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>返回</Text>
        </Pressable>
        <Text style={styles.title}>它后来变成了什么？</Text>
        <Text style={styles.subtitle}>{project.title}</Text>
        <Text style={styles.formLabel}>成果类型</Text>
        <TextInput
          value={typeValue}
          onChangeText={onTypeChange}
          placeholder="例如：视频、课程、小红书账号、实验作品"
          placeholderTextColor="#9B8E88"
          style={styles.tagInput}
        />
        <Text style={styles.formLabel}>转化过程 / 困难 / 注意事项</Text>
        <TextInput
          value={descriptionValue}
          onChangeText={onDescriptionChange}
          placeholder="在把这个想法做出来的过程中，你遇到了什么问题？"
          placeholderTextColor="#9B8E88"
          multiline
          textAlignVertical="top"
          style={styles.outcomeInput}
        />
        <Pressable accessibilityRole="button" onPress={onSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>放入灵感小窝</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function WorksView({
  outcomes,
  projects,
  onOpenOutcome,
}: {
  outcomes: Outcome[];
  projects: Project[];
  onOpenOutcome: (outcome: Outcome) => void;
}) {
  const sortedOutcomes = [...outcomes].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>灵感小窝</Text>
        <Text style={styles.subtitle}>世界上又多了一个好玩的小东西</Text>
        <View style={styles.list}>
          {sortedOutcomes.length > 0 ? (
            sortedOutcomes.map((outcome, index) => {
              const project = projects.find((item) => item.id === outcome.project_id);

              return (
                <Pressable
                  key={outcome.id}
                  accessibilityRole="button"
                  onPress={() => onOpenOutcome(outcome)}
                  style={({ pressed }) => [
                    styles.outcomeCard,
                    index % 2 === 0 ? styles.cardTone3 : styles.cardTone2,
                    pressed ? styles.cardPressed : null,
                  ]}
                >
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {project?.title ?? '未找到来源项目'}
                  </Text>
                  <Text style={styles.time}>
                    {outcome.type} · {formatTime(outcome.completed_at)}
                  </Text>
                  <Text style={styles.cardText} numberOfLines={2}>
                    {outcome.resultDescription || '还没有填写转化说明。'}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>灵感小窝还空着</Text>
              <Text style={styles.emptyHint}>项目标记完成后，会在这里沉淀成成果。</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function OutcomeDetailView({
  outcome,
  project,
  linkedIdeas,
  onOpenIdea,
  onBack,
}: {
  outcome: Outcome;
  project: Project | null;
  linkedIdeas: Idea[];
  onOpenIdea: (idea: Idea) => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>返回</Text>
        </Pressable>
        <Text style={styles.title}>成果详情</Text>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{project?.title ?? '未找到来源项目'}</Text>
          <Text style={styles.detailTime}>完成时间：{formatTime(outcome.completed_at)}</Text>
          <Text style={styles.detailTime}>成果类型：{outcome.type || '未填写'}</Text>
          <Text style={styles.formLabel}>转化过程 / 困难 / 注意事项</Text>
          <Text style={styles.detailText}>{outcome.resultDescription || '还没有填写转化说明。'}</Text>
          <Text style={styles.detailTime}>来源项目：{project?.title ?? '未知项目'}</Text>
          <Text style={styles.formLabel}>关联过的灵感</Text>
          <View style={styles.relatedList}>
            {linkedIdeas.length > 0 ? (
              linkedIdeas.map((idea) => (
                <Pressable key={idea.id} accessibilityRole="button" onPress={() => onOpenIdea(idea)} style={styles.relatedCard}>
                  <Text style={styles.relatedOptionText} numberOfLines={2}>
                    {getIdeaTitle(idea)}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyHint}>这个成果暂时没有关联灵感。</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileView({
  tags,
  impactIdeaCount,
  getUsageCount,
  onExport,
  onCreateTag,
  onToggleFavorite,
  onRenameTag,
  onDeleteTag,
}: {
  tags: Tag[];
  impactIdeaCount: number;
  getUsageCount: (tagId: string) => number;
  onExport: (options: ExportOptions) => void;
  onCreateTag: (name: string) => void;
  onToggleFavorite: (tagId: string) => void;
  onRenameTag: (tagId: string, name: string) => void;
  onDeleteTag: (tagId: string) => void;
}) {
  const [tagName, setTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [exportType, setExportType] = useState<ExportContentType>('ideas');
  const [exportTagIds, setExportTagIds] = useState<string[]>([]);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const handleCreate = () => {
    const name = tagName.trim();

    if (!name) {
      return;
    }

    onCreateTag(name);
    setTagName('');
  };

  const startRenameTag = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  };

  const submitRenameTag = () => {
    if (!editingTagId) {
      return;
    }

    onRenameTag(editingTagId, editingTagName);
    setEditingTagId(null);
    setEditingTagName('');
  };

  const toggleExportTag = (tagId: string) => {
    setExportTagIds((current) => (current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]));
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>本地设置</Text>
        <Text style={styles.title}>设置</Text>
        <Text style={styles.subtitle}>标签管理入口</Text>
        <View style={styles.insightCard}>
          <Text style={styles.cardTitle}>创作洞察</Text>
          <Text style={styles.cardText}>这些事，你一直记得</Text>
          <Text style={styles.time}>当前有 {impactIdeaCount} 条灵感被多个项目反复使用。</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.formLabel}>内容导出</Text>
          <Text style={styles.emptyHint}>第一版导出 TXT，可按标签、时间和内容类型筛选。</Text>
          <Text style={styles.formLabel}>导出类型</Text>
          <View style={styles.statusRow}>
            {(['ideas', 'projects', 'outcomes'] as ExportContentType[]).map((type) => (
              <Pressable
                key={type}
                accessibilityRole="button"
                onPress={() => setExportType(type)}
                style={[styles.statusButton, exportType === type ? styles.statusButtonActive : null]}
              >
                <Text style={styles.statusButtonText}>{getExportTypeLabel(type)}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.formLabel}>标签筛选</Text>
          <View style={styles.tagRow}>
            {tags.length > 0 ? (
              tags.map((tag) => (
                <TagChip key={tag.id} tag={tag} selected={exportTagIds.includes(tag.id)} onPress={() => toggleExportTag(tag.id)} />
              ))
            ) : (
              <Text style={styles.emptyHint}>暂无标签，默认导出全部。</Text>
            )}
          </View>
          <Text style={styles.formLabel}>时间范围</Text>
          <TextInput
            value={exportStartDate}
            onChangeText={setExportStartDate}
            placeholder="开始日期，例如 2026-05-01"
            placeholderTextColor="#9B8E88"
            style={styles.tagInput}
          />
          <TextInput
            value={exportEndDate}
            onChangeText={setExportEndDate}
            placeholder="结束日期，例如 2026-05-31"
            placeholderTextColor="#9B8E88"
            style={styles.tagInput}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              onExport({
                type: exportType,
                tagIds: exportTagIds,
                startDate: exportStartDate,
                endDate: exportEndDate,
              })
            }
            style={styles.smallActionButton}
          >
            <Text style={styles.smallActionButtonText}>导出内容</Text>
          </Pressable>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.formLabel}>创建标签</Text>
          <TextInput
            value={tagName}
            onChangeText={setTagName}
            placeholder="输入标签名"
            placeholderTextColor="#9B8E88"
            style={styles.tagInput}
          />
          <Pressable accessibilityRole="button" onPress={handleCreate} style={styles.smallActionButton}>
            <Text style={styles.smallActionButtonText}>创建标签</Text>
          </Pressable>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.formLabel}>全部标签</Text>
          {tags.length > 0 ? (
            tags.map((tag) => (
              <View key={tag.id} style={styles.tagManageRow}>
                {editingTagId === tag.id ? (
                  <>
                    <TextInput
                      value={editingTagName}
                      onChangeText={setEditingTagName}
                      placeholder="修改标签名"
                      placeholderTextColor="#9B8E88"
                      style={styles.tagInput}
                    />
                    <View style={styles.tagManageActions}>
                      <Pressable accessibilityRole="button" onPress={submitRenameTag} style={styles.manageButton}>
                        <Text style={styles.manageButtonText}>保存</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" onPress={() => setEditingTagId(null)} style={styles.manageButtonSoft}>
                        <Text style={styles.manageButtonSoftText}>取消</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <TagChip tag={tag} count={getUsageCount(tag.id)} />
                    <View style={styles.tagManageActions}>
                      <Pressable accessibilityRole="button" onPress={() => startRenameTag(tag)} style={styles.manageButtonSoft}>
                        <Text style={styles.manageButtonSoftText}>编辑</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" onPress={() => onToggleFavorite(tag.id)} style={styles.manageButton}>
                        <Text style={styles.manageButtonText}>{tag.isFavorite ? '取消常用' : '设为常用'}</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" onPress={() => onDeleteTag(tag.id)} style={[styles.manageButton, styles.deleteManageButton]}>
                        <Text style={styles.manageButtonText}>删除</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyHint}>还没有标签。</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function PlaceholderView({ label }: { label: string }) {
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>功能预留</Text>
        <Text style={styles.title}>{label}</Text>
        <View style={styles.detailCard}>
          <Text style={styles.detailText}>这里保留产品主框架，后续再逐步实现。</Text>
          <Text style={styles.detailTime}>核心路径：灵感 → 标签 → 关联 → 项目 → 成果 → Impact → 分享卡片</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <View style={[styles.statusPill, status === 'completed' ? styles.statusPillCompleted : null]}>
      <Text style={styles.statusPillText}>{getProjectStatusLabel(status)}</Text>
    </View>
  );
}

function getProjectStatusLabel(status: ProjectStatus) {
  const labels: Record<ProjectStatus, string> = {
    draft: '草稿',
    in_progress: '进行中',
    completed: '已完成',
  };

  return labels[status];
}

function getExportTypeLabel(type: ExportContentType) {
  const labels: Record<ExportContentType, string> = {
    ideas: '灵感',
    projects: '项目',
    outcomes: '成果',
  };

  return labels[type];
}

function getIdeaTitle(idea: Idea) {
  const explicitTitle = idea.title?.trim();

  if (explicitTitle) {
    return explicitTitle;
  }

  const cleanContent = idea.content.trim().replace(/\s+/g, ' ');
  return cleanContent.length > 18 ? `${cleanContent.slice(0, 18)}...` : cleanContent || '未命名灵感';
}

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F2EF',
  },
  shell: {
    flex: 1,
    backgroundColor: '#F9F2EF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F9F2EF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  eyebrow: {
    color: '#D97A6C',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    ...theme.typography.titleFont,
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    color: '#888888',
    ...theme.typography.smallText,
    fontWeight: '400',
    marginBottom: 24,
  },
  list: {
    gap: 16,
    marginBottom: 24,
  },
  card: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
    shadowColor: '#C9795C',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardTone0: {
    backgroundColor: '#FFF1E8',
  },
  cardTone1: {
    backgroundColor: '#F3F7EA',
  },
  cardTone2: {
    backgroundColor: '#EEF6FD',
  },
  cardTone3: {
    backgroundColor: '#FBEAEA',
  },
  cardPressed: {
    opacity: 0.82,
  },
  cardText: {
    color: '#3A3A3A',
    ...theme.typography.smallText,
    fontWeight: '400',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#2F2F2F',
    ...theme.typography.bodyText,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  time: {
    color: '#888888',
    ...theme.typography.tinyText,
    fontWeight: '400',
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  homeTitleBlock: {
    flex: 1,
  },
  greeting: {
    color: '#888888',
    ...theme.typography.smallText,
    fontWeight: '400',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  brandTitle: {
    ...theme.typography.titleFont,
    ...theme.typography.largeTitle,
    fontWeight: '500',
    marginBottom: 8,
  },
  avatarSlot: {
    width: 50,
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  avatarText: {
    color: '#D97A6C',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    ...theme.typography.titleFont,
    fontSize: 20,
  },
  sectionHint: {
    color: '#D97A6C',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 248, 243, 0.78)',
  },
  tagPillSoft: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(252, 206, 180, 0.42)',
  },
  tagText: {
    color: '#3A3A3A',
    ...theme.typography.tinyText,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tagChipBlock: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 243, 0.75)',
  },
  tagChipSelected: {
    borderColor: '#D97A6C',
    borderWidth: 2,
  },
  removableTag: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF8F3',
    borderWidth: 1,
    borderColor: '#F1DCD2',
  },
  removeTagText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '500',
  },
  tagCount: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '500',
  },
  formLabel: {
    color: '#2F2F2F',
    ...theme.typography.bodyText,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  emptyHint: {
    color: '#888888',
    ...theme.typography.smallText,
    fontWeight: '400',
    marginBottom: 12,
  },
  tagInput: {
    minHeight: 48,
    backgroundColor: '#FFF8F3',
    color: '#3A3A3A',
    ...theme.typography.bodyText,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1DCD2',
    marginBottom: 16,
  },
  suggestionBox: {
    gap: 8,
    marginTop: -8,
    marginBottom: 16,
  },
  suggestionItem: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF8F3',
    borderWidth: 1,
    borderColor: '#F1DCD2',
  },
  suggestionText: {
    color: '#3A3A3A',
    fontSize: 13,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minHeight: 64,
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 243, 0.75)',
  },
  orangeMetric: {
    backgroundColor: '#FFF1E8',
  },
  greenMetric: {
    backgroundColor: '#F3F7EA',
  },
  blueMetric: {
    backgroundColor: '#EEF6FD',
  },
  metricValue: {
    color: '#2F2F2F',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  metricLabel: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
  },
  ipPanel: {
    minHeight: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
  },
  insightText: {
    color: '#888888',
    ...theme.typography.tinyText,
    marginBottom: 16,
  },
  ipCopy: {
    flex: 1,
    gap: 7,
  },
  ipTitle: {
    color: '#2F2F2F',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  ipText: {
    color: '#3A3A3A',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  ipVisual: {
    width: 104,
    height: 104,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(217, 122, 108, 0.2)',
    backgroundColor: '#F9F2EF',
  },
  candyDot: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFF8F3',
  },
  candyOrange: {
    left: 18,
    bottom: 20,
    backgroundColor: '#F98C53',
  },
  candyGreen: {
    right: 18,
    bottom: 34,
    backgroundColor: '#D2E0AA',
  },
  candyBlue: {
    left: 38,
    top: 24,
    backgroundColor: '#ABD7FB',
  },
  candyJar: {
    width: 116,
    minHeight: 110,
    flexDirection: 'row',
    flexWrap: 'wrap-reverse',
    alignContent: 'flex-end',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(217, 122, 108, 0.18)',
    backgroundColor: '#F9F2EF',
  },
  candyPiece: {
    borderWidth: 2,
    borderColor: '#FFF8F3',
  },
  candyPieceUsed: {
    shadowColor: '#D97A6C',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  ipVisualGroup: {
    width: 128,
    alignItems: 'center',
    gap: 8,
  },
  ipBlankPlaceholder: {
    width: 128,
    minHeight: 110,
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#F98C53',
    shadowColor: '#C9795C',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabPlus: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginTop: -2,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8F3',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    marginBottom: 18,
  },
  backText: {
    color: '#3A3A3A',
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    minHeight: 180,
    backgroundColor: '#FFF8F3',
    color: '#3A3A3A',
    ...theme.typography.bodyText,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1DCD2',
    marginBottom: 16,
  },
  compactInput: {
    minHeight: 96,
    backgroundColor: '#FFF8F3',
    color: '#3A3A3A',
    ...theme.typography.bodyText,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1DCD2',
    marginBottom: 12,
  },
  outcomeInput: {
    minHeight: 230,
    backgroundColor: '#FFF8F3',
    color: '#3A3A3A',
    ...theme.typography.bodyText,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1DCD2',
    marginBottom: 16,
  },
  titleInput: {
    minHeight: 54,
    backgroundColor: '#FFF8F3',
    color: '#2F2F2F',
    ...theme.typography.mediumText,
    fontWeight: '500',
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1DCD2',
    marginBottom: 12,
  },
  saveButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#D97A6C',
    marginBottom: 18,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  smallActionButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#D97A6C',
  },
  smallActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  smallButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#D97A6C',
  },
  deleteButton: {
    backgroundColor: '#B85C48',
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#FFF8F3',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
  },
  detailText: {
    color: '#3A3A3A',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
    marginBottom: 20,
  },
  detailTitle: {
    color: '#2F2F2F',
    ...theme.typography.mediumText,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  detailTime: {
    color: '#888888',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    marginBottom: 8,
  },
  sharePlaceholder: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    marginTop: 8,
    backgroundColor: '#FCCEB4',
    paddingHorizontal: 14,
    flex: 1,
  },
  sharePlaceholderText: {
    color: '#3A3A3A',
    fontSize: 14,
    fontWeight: '600',
  },
  insightCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#F3F7EA',
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
    marginBottom: 16,
  },
  impactCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#FBEAEA',
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
    marginBottom: 16,
  },
  ideaShareCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.1)',
    marginTop: 10,
    marginBottom: 8,
    shadowColor: '#C9795C',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  shareLogoSlot: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FBEAEA',
    marginBottom: 12,
  },
  shareLogoText: {
    color: '#D97A6C',
    ...theme.typography.tinyText,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  shareCardTitle: {
    color: '#2F2F2F',
    ...theme.typography.bodyText,
    fontWeight: '500',
    marginBottom: 8,
  },
  shareCardBody: {
    color: '#3A3A3A',
    ...theme.typography.smallText,
    marginBottom: 12,
  },
  shareActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  relatedList: {
    gap: 10,
    marginBottom: 16,
  },
  relatedOption: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F3F7EA',
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
  },
  relatedOptionSelected: {
    backgroundColor: '#FFF1E8',
    borderColor: '#D97A6C',
  },
  relatedOptionText: {
    color: '#3A3A3A',
    ...theme.typography.smallText,
    fontWeight: '400',
    marginBottom: 6,
  },
  relatedCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#EEF6FD',
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
  },
  projectIdeaCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#EEF6FD',
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
  },
  ideaCardDisabled: {
    opacity: 0.58,
  },
  libraryLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tagSideMenu: {
    width: 82,
    gap: 8,
  },
  sideMenuItem: {
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
  },
  sideMenuItemActive: {
    backgroundColor: '#FBEAEA',
    borderColor: '#D97A6C',
  },
  sideMenuText: {
    color: '#3A3A3A',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  sideMenuCount: {
    color: '#888888',
    fontSize: 11,
    marginTop: 2,
  },
  libraryList: {
    flex: 1,
    gap: 12,
  },
  libraryCard: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
    shadowColor: '#C9795C',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  libraryCardTitle: {
    color: '#2F2F2F',
    ...theme.typography.bodyText,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginBottom: 7,
  },
  libraryCardText: {
    color: '#3A3A3A',
    ...theme.typography.smallText,
    fontWeight: '400',
    marginBottom: 10,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
  },
  emptyTitle: {
    color: '#2F2F2F',
    ...theme.typography.bodyText,
    fontWeight: '500',
    marginBottom: 6,
  },
  projectCard: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
    shadowColor: '#C9795C',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  outcomeCard: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 121, 92, 0.08)',
    shadowColor: '#C9795C',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: '#F1DCD2',
  },
  statusButtonActive: {
    backgroundColor: '#FBEAEA',
    borderColor: '#D97A6C',
  },
  statusButtonText: {
    color: '#3A3A3A',
    ...theme.typography.tinyText,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: '#F1DCD2',
  },
  statusPillCompleted: {
    backgroundColor: '#F3F7EA',
  },
  statusPillText: {
    color: '#888888',
    ...theme.typography.tinyText,
    fontWeight: '500',
  },
  tagManageRow: {
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1DCD2',
  },
  tagManageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  manageButton: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#D97A6C',
  },
  manageButtonSoft: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: '#F1DCD2',
  },
  manageButtonSoftText: {
    color: '#D97A6C',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteManageButton: {
    backgroundColor: '#B85C48',
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFF8F3',
    borderTopWidth: 1,
    borderTopColor: '#F1DCD2',
    shadowColor: '#C9795C',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  tabText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#D97A6C',
  },
});
