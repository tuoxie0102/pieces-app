import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../screens/HomeScreen';
import { IdeasScreen } from '../screens/IdeasScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { StudioScreen } from '../screens/StudioScreen';
import { WorksScreen } from '../screens/WorksScreen';
import { theme } from '../theme/theme';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIconMap: Record<
  keyof RootTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Ideas: { active: 'sparkles', inactive: 'sparkles-outline' },
  Studio: { active: 'construct', inactive: 'construct-outline' },
  Works: { active: 'albums', inactive: 'albums-outline' },
  Profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.primary,
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -6 },
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icon = tabIconMap[route.name][focused ? 'active' : 'inactive'];
          return <Ionicons name={icon} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
      <Tab.Screen name="Ideas" component={IdeasScreen} options={{ title: '灵感库' }} />
      <Tab.Screen name="Studio" component={StudioScreen} options={{ title: '创作区' }} />
      <Tab.Screen name="Works" component={WorksScreen} options={{ title: '成果库' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
}
