import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Application from 'expo-application';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FeatureCard } from '../components/FeatureCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import type { CreativeProject, Idea, Outcome, ProjectIdea } from '../domain/models';
import type { RootStackParamList } from '../navigation/types';
import { listIdeas } from '../storage/repositories/ideaRepository';
import { listOutcomes } from '../storage/repositories/outcomeRepository';
import { listProjectIdeas } from '../storage/repositories/projectIdeaRepository';
import { listProjects } from '../storage/repositories/projectRepository';
import { theme } from '../theme/theme';
import { getImpactInsight } from '../utils/impact';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.all([listIdeas(), listProjects(), listProjectIdeas(), listOutcomes()]).then(
        ([nextIdeas, nextProjects, nextProjectIdeas, nextOutcomes]) => {
          if (!active) {
            return;
          }

          setIdeas(nextIdeas);
          setProjects(nextProjects);
          setProjectIdeas(nextProjectIdeas);
          setOutcomes(nextOutcomes);
        },
      );

      return () => {
        active = false;
      };
    }, []),
  );

  const insight = getImpactInsight({
    ideasLength: ideas.length,
    projects,
    projectIdeas,
    outcomes,
  });
  const appVersion = Application.nativeApplicationVersion ?? '开发版本';
  const buildVersion = Application.nativeBuildVersion ?? '开发构建';

  return (
    <Screen>
      <SectionHeader title="我的" caption="本地数据、同步策略和内测设置会放在这里。" />

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>内测版数据策略</Text>
        <Text style={styles.noticeCopy}>当前默认本地优先，数据通过 AsyncStorage 保存。云端同步接口已预留，暂不启用。</Text>
      </View>

      <View style={styles.stack}>
        <View style={styles.impactCard}>
          <Text style={styles.manageTitle}>Impact 洞察</Text>
          <Text style={styles.manageCopy}>{insight}</Text>
        </View>
        <View style={styles.manageCard}>
          <Text style={styles.manageTitle}>标签系统</Text>
          <Text style={styles.manageCopy}>管理常用标签、查看使用次数，给灵感库一点甜甜的秩序。</Text>
          <PrimaryButton label="进入标签管理" icon="pricetags-outline" onPress={() => navigation.navigate('TagManager')} />
        </View>
        <FeatureCard icon="phone-portrait-outline" title="Android APK" body="项目配置面向 Expo Android 构建，可使用 EAS 生成内测 APK。" />
        <FeatureCard icon="server-outline" title="国内云服务预留" body="cloudAdapter 已隔离，后续可接入对象存储、数据库或自建 API。" />
      </View>

      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>版本：v{appVersion}</Text>
        <Text style={styles.versionText}>构建号：{buildVersion}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primarySoft,
    marginBottom: theme.spacing.lg,
  },
  noticeTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  noticeCopy: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  stack: {
    gap: theme.spacing.md,
  },
  manageCard: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.greenSoft,
  },
  impactCard: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.blueSoft,
  },
  manageTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  manageCopy: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  versionText: {
    color: '#999999',
    fontSize: 12,
    lineHeight: 18,
  },
});
