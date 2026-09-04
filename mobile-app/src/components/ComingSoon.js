import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from './ScreenContainer';
import { FadeSlideIn } from './Motion';
import { radius, shadow } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function ComingSoon({ title, description, docSection, icon = 'clock' }) {
  const { colors: themeColors } = useTheme();

  return (
    <ScreenContainer contentStyle={styles.content}>
      <FadeSlideIn duration={400} style={styles.wrap}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: themeColors.theme === 'dark' ? themeColors.card : '#FFFFFF',
              borderColor: themeColors.border,
            },
          ]}
        >
          <Feather name={icon} size={26} color={themeColors.primaryBright} />
        </View>
        <View
          style={[
            styles.tag,
            {
              backgroundColor: themeColors.theme === 'dark' ? 'rgba(255,255,255,0.06)' : themeColors.bgSecondary,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Text style={[styles.tagText, { color: themeColors.textMuted }]}>COMING SOON</Text>
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: themeColors.textMuted }]}>{description}</Text>
        {docSection ? (
          <Text style={[styles.hint, { color: themeColors.primaryBright }]}>
            See {docSection} in the requirements doc for the full spec.
          </Text>
        ) : null}
      </FadeSlideIn>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 64, flexGrow: 1 },
  wrap: { alignItems: 'center' },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadow.card,
    shadowOpacity: 0.05,
  },
  tag: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  description: { fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  hint: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
