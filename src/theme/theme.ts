export const theme = {
  colors: {
    background: '#F9F2EF',
    surface: '#FFF1E8',
    elevated: '#FFF8F3',
    primary: '#D97A6C',
    primarySoft: '#FBEAEA',
    greenSoft: '#F3F7EA',
    blueSoft: '#EEF6FD',
    accent: '#F98C53',
    accentSoft: '#FFF1E8',
    ink: '#2F2F2F',
    text: '#3A3A3A',
    muted: '#888888',
    border: '#F1DCD2',
    success: '#7F9B53',
    warning: '#D99A42',
    tabInactive: '#B79D92',
  },
  typography: {
    titleFont: {
      fontWeight: '500',
      letterSpacing: 1.4,
      color: '#D97A6C',
    },
    smallText: {
      fontSize: 12,
      lineHeight: 17,
    },
    tinyText: {
      fontSize: 11,
      lineHeight: 15,
    },
    bodyText: {
      fontSize: 15,
      lineHeight: 23,
    },
    mediumText: {
      fontSize: 17,
      lineHeight: 24,
    },
    largeTitle: {
      fontSize: 34,
      lineHeight: 40,
    },
    body: {
      fontSize: 15,
      lineHeight: 23,
      color: '#3A3A3A',
    },
    meta: {
      color: '#888888',
    },
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 26,
    pill: 999,
  },
} as const;
