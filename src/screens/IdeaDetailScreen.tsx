import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';

import { IdeaListCard } from '../components/IdeaListCard';
import { IdeaShareCard } from '../components/IdeaShareCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { TagChip } from '../components/TagChip';
import type { AppSettings, CreativeProject, Idea, IdeaTag, Outcome, ProjectIdea, Tag } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { listIdeaTags } from '../storage/repositories/ideaTagRepository';
import { deleteIdea, listIdeas } from '../storage/repositories/ideaRepository';
import { listOutcomes } from '../storage/repositories/outcomeRepository';
import { listProjectIdeas } from '../storage/repositories/projectIdeaRepository';
import { listProjects } from '../storage/repositories/projectRepository';
import { defaultSettings, getSettings } from '../storage/repositories/settingsRepository';
import { listTags } from '../storage/repositories/tagRepository';
import { theme } from '../theme/theme';
import { formatDateTime } from '../utils/formatDate';
import { getIdeaImpact } from '../utils/impact';
import { projectStatusLabels } from '../utils/projectStatus';

type IdeaDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'IdeaDetail'>;

export function IdeaDetailScreen({ navigation, route }: IdeaDetailScreenProps) {
  const shareCardRef = useRef<ViewShot>(null);
  const [idea, setIdea] = useState<Idea | undefined>();
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ideaTags, setIdeaTags] = useState<IdeaTag[]>([]);
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [showShareCard, setShowShareCard] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.all([listIdeas(), listProjects(), listTags(), listIdeaTags(), listProjectIdeas(), listOutcomes(), getSettings()]).then(([nextIdeas, nextProjects, nextTags, nextIdeaTags, nextProjectIdeas, nextOutcomes, nextSettings]) => {
        if (!active) {
          return;
        }

        setAllIdeas(nextIdeas);
        setIdea(nextIdeas.find((item) => item.id === route.params.ideaId));
        setProjects(nextProjects);
        setTags(nextTags);
        setIdeaTags(nextIdeaTags);
        setProjectIdeas(nextProjectIdeas);
        setOutcomes(nextOutcomes);
        setSettings(nextSettings);
      });

      return () => {
        active = false;
      };
    }, [route.params.ideaId]),
  );

  if (!idea) {
    return (
      <Screen>
        <Text style={styles.missing}>这条灵感暂时没有找到。</Text>
      </Screen>
    );
  }

  const relatedIdeas = allIdeas.filter((item) => idea.relatedIdeaIds.includes(item.id));
  const usedByProjectIds = projectIdeas
    .filter((link) => link.idea_id === idea.id)
    .map((link) => link.project_id);
  const usedByProjects = projects.filter((project) => usedByProjectIds.includes(project.id));
  const impact = getIdeaImpact({
    ideaId: idea.id,
    projects,
    projectIdeas,
    outcomes,
  });
  const currentTagIds = ideaTags.filter((link) => link.idea_id === idea.id).map((link) => link.tag_id);
  const currentTags = tags.filter((tag) => currentTagIds.includes(tag.id));
  const getTagsForIdea = (ideaId: string) => {
    const tagIds = ideaTags.filter((link) => link.idea_id === ideaId).map((link) => link.tag_id);
    return tags.filter((tag) => tagIds.includes(tag.id));
  };

  const captureShareCard = async () => {
    if (!shareCardRef.current) {
      return undefined;
    }

    return captureRef(shareCardRef.current, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
  };

  const handleGenerateShareCard = () => {
    setShowShareCard(true);
  };

  const prepareShareCard = async () => {
    if (!showShareCard) {
      setShowShareCard(true);
      await new Promise((resolve) => {
        setTimeout(resolve, 260);
      });
    }
  };

  const handleSaveShareCard = async () => {
    await prepareShareCard();

    const permission = await MediaLibrary.requestPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('需要相册权限', '允许访问相册后，才能把灵感卡片保存到手机。');
      return;
    }

    const uri = await captureShareCard();

    if (!uri) {
      Alert.alert('保存失败', '卡片还没有准备好，请稍后再试。');
      return;
    }

    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('已保存', '灵感卡片已经保存到手机相册。');
  };

  const handleShareCard = async () => {
    await prepareShareCard();

    const canShare = await Sharing.isAvailableAsync();

    if (!canShare) {
      Alert.alert('暂不支持分享', '当前设备没有可用的系统分享能力。');
      return;
    }

    const uri = await captureShareCard();

    if (!uri) {
      Alert.alert('分享失败', '卡片还没有准备好，请稍后再试。');
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: '分享灵感卡片',
    });
  };

  return (
    <Screen>
      <View style={styles.actionRow}>
        <PrimaryButton label="编辑" icon="create-outline" onPress={() => navigation.navigate('IdeaForm', { ideaId: idea.id })} />
        <PrimaryButton
          label="删除"
          icon="trash-outline"
          tone="danger"
          onPress={() => {
            Alert.alert('删除灵感', '删除后会从本地移除，也会清理其他灵感对它的关联。', [
              { text: '取消', style: 'cancel' },
              {
                text: '删除',
                style: 'destructive',
                onPress: async () => {
                  await deleteIdea(idea.id);
                  navigation.goBack();
                },
              },
            ]);
          }}
        />
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.body}>{idea.content}</Text>

        <View style={styles.tagsRow}>
          {currentTags.length > 0 ? (
            currentTags.map((tag) => <TagChip key={tag.id} tag={tag} />)
          ) : (
            <Text style={styles.mutedText}>未添加标签</Text>
          )}
        </View>

        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>创建时间</Text>
          <Text style={styles.metaValue}>{formatDateTime(idea.created_at)}</Text>
          <Text style={styles.metaLabel}>更新时间</Text>
          <Text style={styles.metaValue}>{formatDateTime(idea.updated_at)}</Text>
          <Text style={styles.metaLabel}>图片字段</Text>
          <Text style={styles.metaValue}>{idea.imageUri || '已预留，暂未上传图片'}</Text>
        </View>
      </View>

      <DetailSection title="Impact">
        <View style={styles.impactGrid}>
          <ImpactTile label="被项目使用" value={`${impact.usedCount}`} />
          <ImpactTile label="转化为成果" value={`${impact.completedOutcomeCount}`} />
        </View>
        <View style={styles.impactLine}>
          <Text style={styles.metaLabel}>最近一次被使用</Text>
          <Text style={styles.metaValue}>{impact.lastUsedAt ? formatDateTime(impact.lastUsedAt) : '还没有进入项目'}</Text>
        </View>
        {impact.usedProjects.length > 0 ? (
          <View style={styles.impactProjects}>
            <Text style={styles.metaLabel}>参与过的项目</Text>
            {impact.usedProjects.map((project) => (
              <View key={project.id} style={styles.projectRow}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <Text style={styles.projectStatus}>{projectStatusLabels[project.status]}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.mutedText}>这条灵感还没有被项目使用，之后它可能会慢慢影响新的创作。</Text>
        )}
      </DetailSection>

      <DetailSection title="相关灵感">
        {relatedIdeas.length > 0 ? (
          relatedIdeas.map((relatedIdea) => (
            <IdeaListCard
              key={relatedIdea.id}
              idea={relatedIdea}
              tags={getTagsForIdea(relatedIdea.id)}
              onPress={() => navigation.push('IdeaDetail', { ideaId: relatedIdea.id })}
            />
          ))
        ) : (
          <Text style={styles.mutedText}>暂无相关灵感，可以在编辑页选择推荐或手动关联灵感。</Text>
        )}
      </DetailSection>

      <DetailSection title="被哪些项目使用">
        {usedByProjects.length > 0 ? (
          usedByProjects.map((project) => (
            <View key={project.id} style={styles.projectRow}>
              <Text style={styles.projectTitle}>{project.title}</Text>
              <Text style={styles.projectStatus}>{projectStatusLabels[project.status]}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.mutedText}>暂未被创作项目使用。</Text>
        )}
      </DetailSection>

      <View style={styles.shareBox}>
        <View style={styles.shareCopy}>
          <Text style={styles.nextTitle}>灵感分享卡片</Text>
          <Text style={styles.nextText}>生成一张温柔糖果色卡片，保存到相册或调用系统分享。</Text>
        </View>
        <View style={styles.shareActions}>
          <PrimaryButton label="生成灵感卡片" icon="image-outline" tone="soft" onPress={handleGenerateShareCard} />
          <PrimaryButton label="保存图片" icon="download-outline" onPress={handleSaveShareCard} />
          <PrimaryButton label="分享图片" icon="share-social-outline" tone="soft" onPress={handleShareCard} />
        </View>
      </View>

      {showShareCard ? (
        <View style={styles.sharePreviewBox}>
          <Text style={styles.sectionTitle}>卡片预览</Text>
          <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 1 }}>
            <IdeaShareCard idea={idea} tags={currentTags} settings={settings} />
          </ViewShot>
        </View>
      ) : null}
    </Screen>
  );
}

function ImpactTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.impactTile}>
      <Text style={styles.impactValue}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  detailCard: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primarySoft,
    shadowColor: '#C9795C',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  body: {
    color: theme.colors.ink,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '800',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: theme.spacing.lg,
  },
  metaBox: {
    gap: 6,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
  },
  metaLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  metaValue: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  nextBox: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionBox: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: theme.spacing.md,
  },
  sectionContent: {
    gap: theme.spacing.md,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  impactTile: {
    flex: 1,
    minHeight: 74,
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primarySoft,
  },
  impactValue: {
    color: theme.colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  impactLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  impactLine: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blueSoft,
  },
  impactProjects: {
    gap: theme.spacing.sm,
  },
  mutedText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  projectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
  },
  projectTitle: {
    flex: 1,
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  projectStatus: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  shareBox: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.greenSoft,
  },
  shareCopy: {
    gap: 6,
  },
  shareActions: {
    gap: theme.spacing.sm,
  },
  sharePreviewBox: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nextTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  nextText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  missing: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
