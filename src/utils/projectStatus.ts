import type { ProjectStatus } from '../domain/models';

export const projectStatusLabels: Record<ProjectStatus, string> = {
  draft: '草稿',
  in_progress: '进行中',
  completed: '已完成',
};

export const projectStatusOptions: ProjectStatus[] = ['draft', 'in_progress', 'completed'];
