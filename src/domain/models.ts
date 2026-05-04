export type IdeaStatus = 'inbox' | 'linked' | 'project';
export type ProjectStatus = 'draft' | 'in_progress' | 'completed';
export type OutcomeType = '视频' | '文章' | '课程' | '剧本' | '其他';

export type Idea = {
  id: string;
  content: string;
  imageUri?: string;
  relatedIdeaIds: string[];
  status: IdeaStatus;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  isFavorite: boolean;
  created_at: string;
};

export type IdeaTag = {
  idea_id: string;
  tag_id: string;
};

export type CreativeProject = {
  id: string;
  title: string;
  description: string;
  draftContent: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export type ProjectIdea = {
  project_id: string;
  idea_id: string;
};

export type Outcome = {
  id: string;
  project_id: string;
  type: OutcomeType;
  resultDescription: string;
  completed_at: string;
};

export type AppSettings = {
  userName: string;
  logoUri?: string;
  defaultCardTemplateId: string;
};

export type Work = {
  id: string;
  title: string;
  projectId?: string;
  format: 'article' | 'video' | 'audio' | 'image' | 'other';
  impactScore?: number;
  createdAt: string;
};

export type ShareCardDraft = {
  id: string;
  workId: string;
  title: string;
  subtitle?: string;
  createdAt: string;
};
