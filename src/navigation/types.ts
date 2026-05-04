import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  Home: undefined;
  Ideas: undefined;
  Studio: undefined;
  Works: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  IdeaDetail: {
    ideaId: string;
  };
  IdeaForm: {
    ideaId?: string;
  } | undefined;
  TagManager: undefined;
  ProjectDetail: {
    projectId: string;
  };
  ProjectForm: {
    projectId?: string;
  } | undefined;
  OutcomeForm: {
    projectId: string;
  };
  OutcomeDetail: {
    outcomeId: string;
  };
};
