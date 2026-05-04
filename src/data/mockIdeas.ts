export type HomeIdeaPreview = {
  id: string;
  body: string;
  tags: string[];
  createdAt: string;
  impact: string;
  color: string;
};

export const homeIdeaPreviews: HomeIdeaPreview[] = [
  {
    id: 'idea-001',
    body: '把“灵感”设计成一颗糖果：记录时很轻，整理时慢慢看到口味、颜色和来源。',
    tags: ['产品', '隐喻', '灵感库'],
    createdAt: '今天 09:42',
    impact: '可转成首页 IP 设定',
    color: '#FCCEB4',
  },
  {
    id: 'idea-002',
    body: '创作项目不应该像任务清单，更像一只透明糖罐：每个灵感都能被看见、组合、发酵。',
    tags: ['创作系统', '项目'],
    createdAt: '昨天 22:16',
    impact: '关联 2 个项目方向',
    color: '#D2E0AA',
  },
  {
    id: 'idea-003',
    body: '分享卡片可以保留作品背后的第一颗灵感，让成果不只是展示，也是一段创作来路。',
    tags: ['分享卡片', '成果库'],
    createdAt: '周日 15:08',
    impact: '适合做模板文案',
    color: '#ABD7FB',
  },
  {
    id: 'idea-004',
    body: 'Impact 先别做复杂仪表盘，用“被谁记住了、带来了什么回声”来表达更有人味。',
    tags: ['Impact', '复盘'],
    createdAt: '周六 11:30',
    impact: '待拆成指标模型',
    color: '#FFE5D7',
  },
];
