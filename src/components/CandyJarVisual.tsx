import { StyleSheet, Text, View } from 'react-native';

import type { Idea, IdeaTag, ProjectIdea, Tag } from '../domain/models';
import { theme } from '../theme/theme';

type CandyJarVisualProps = {
  ideas: Idea[];
  tags: Tag[];
  ideaTags: IdeaTag[];
  projectIdeas: ProjectIdea[];
};

const candySlots = [
  { left: 22, top: 54 },
  { left: 52, top: 42 },
  { left: 82, top: 58 },
  { left: 34, top: 86 },
  { left: 68, top: 82 },
  { left: 104, top: 90 },
  { left: 18, top: 118 },
  { left: 52, top: 118 },
  { left: 88, top: 124 },
  { left: 118, top: 118 },
  { left: 36, top: 150 },
  { left: 74, top: 152 },
  { left: 108, top: 148 },
];

const fallbackColors = [
  theme.colors.primarySoft,
  theme.colors.greenSoft,
  theme.colors.blueSoft,
  theme.colors.accentSoft,
];

export function CandyJarVisual({ ideas, tags, ideaTags, projectIdeas }: CandyJarVisualProps) {
  const visibleIdeas = ideas.slice(0, candySlots.length);
  const usedIdeaIds = new Set(projectIdeas.map((link) => link.idea_id));

  const getCandyColor = (ideaId: string, index: number) => {
    const tagId = ideaTags.find((link) => link.idea_id === ideaId)?.tag_id;
    return tags.find((tag) => tag.id === tagId)?.color ?? fallbackColors[index % fallbackColors.length];
  };

  return (
    <View style={styles.container}>
      <View style={styles.jarLid} />
      <View style={styles.jarNeck} />
      <View style={styles.jarBody}>
        <View style={styles.jarHighlight} />
        {visibleIdeas.length > 0 ? (
          visibleIdeas.map((idea, index) => {
            const slot = candySlots[index];
            const used = usedIdeaIds.has(idea.id);

            return (
              <View
                key={idea.id}
                style={[
                  styles.candy,
                  {
                    left: slot.left,
                    top: slot.top,
                    backgroundColor: getCandyColor(idea.id, index),
                  },
                  used ? styles.usedCandy : null,
                ]}
              />
            );
          })
        ) : (
          <Text style={styles.emptyText}>等待第一颗灵感</Text>
        )}
      </View>
      <View style={styles.baseShadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 164,
    height: 220,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  jarLid: {
    width: 92,
    height: 18,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  jarNeck: {
    width: 72,
    height: 22,
    marginTop: -2,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(249, 140, 83, 0.2)',
  },
  jarBody: {
    width: 150,
    height: 176,
    marginTop: -2,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(249, 140, 83, 0.26)',
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    overflow: 'hidden',
  },
  jarHighlight: {
    position: 'absolute',
    left: 22,
    top: 22,
    width: 20,
    height: 96,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  candy: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.68)',
  },
  usedCandy: {
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.46,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
    transform: [{ scale: 1.08 }],
  },
  emptyText: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 78,
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  baseShadow: {
    width: 118,
    height: 12,
    marginTop: -4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(201, 121, 92, 0.12)',
  },
});
