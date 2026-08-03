import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from './ScreenContainer';
import { colors, radius, shadow } from '../theme';

// Shared placeholder for modules not yet built — each references the
// requirements doc section covering that module's functional requirements.
export default function ComingSoon({ title, description, docSection, icon = 'clock' }) {
  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.wrap}>
        <View style={styles.iconBadge}>
          <Feather name={icon} size={26} color={colors.primary} />
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>COMING SOON</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {docSection ? (
          <Text style={styles.hint}>See {docSection} in the requirements doc for the full spec.</Text>
        ) : null}
      </View>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadow.card,
    shadowOpacity: 0.05,
  },
  tag: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: colors.muted },
  title: { fontSize: 22, fontWeight: '800', color: colors.navy, marginBottom: 8, textAlign: 'center' },
  description: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  hint: { fontSize: 12, color: colors.primary, fontWeight: '600', textAlign: 'center' },
});
