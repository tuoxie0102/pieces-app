import type { CreativeProject, Idea, IdeaTag, Outcome, ProjectIdea, ShareCardDraft, Tag, Work } from '../../domain/models';

export type CloudSyncPayload = {
  ideas: Idea[];
  tags: Tag[];
  ideaTags: IdeaTag[];
  projects: CreativeProject[];
  projectIdeas: ProjectIdea[];
  outcomes: Outcome[];
  works: Work[];
  shareCards: ShareCardDraft[];
};

export type CloudAdapter = {
  syncUp(payload: CloudSyncPayload): Promise<void>;
  syncDown(): Promise<Partial<CloudSyncPayload>>;
};

export const disabledCloudAdapter: CloudAdapter = {
  async syncUp() {
    return undefined;
  },
  async syncDown() {
    return {};
  },
};
