import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { IdeaDetailScreen } from '../screens/IdeaDetailScreen';
import { IdeaFormScreen } from '../screens/IdeaFormScreen';
import { OutcomeDetailScreen } from '../screens/OutcomeDetailScreen';
import { OutcomeFormScreen } from '../screens/OutcomeFormScreen';
import { ProjectDetailScreen } from '../screens/ProjectDetailScreen';
import { ProjectFormScreen } from '../screens/ProjectFormScreen';
import { TagManagerScreen } from '../screens/TagManagerScreen';
import { theme } from '../theme/theme';
import { AppTabs } from './AppTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerShadowVisible: false,
        headerTintColor: theme.colors.ink,
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '800',
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen name="IdeaDetail" component={IdeaDetailScreen} options={{ title: '灵感详情' }} />
      <Stack.Screen
        name="IdeaForm"
        component={IdeaFormScreen}
        options={({ route }) => ({ title: route.params?.ideaId ? '编辑灵感' : '新增灵感' })}
      />
      <Stack.Screen name="TagManager" component={TagManagerScreen} options={{ title: '标签管理' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: '项目详情' }} />
      <Stack.Screen
        name="ProjectForm"
        component={ProjectFormScreen}
        options={({ route }) => ({ title: route.params?.projectId ? '编辑项目' : '创建项目' })}
      />
      <Stack.Screen name="OutcomeForm" component={OutcomeFormScreen} options={{ title: '登记成果' }} />
      <Stack.Screen name="OutcomeDetail" component={OutcomeDetailScreen} options={{ title: '成果详情' }} />
    </Stack.Navigator>
  );
}
