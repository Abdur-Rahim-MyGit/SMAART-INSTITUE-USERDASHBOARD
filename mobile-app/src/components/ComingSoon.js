import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenContainer from './ScreenContainer';
import { colors } from '../theme';

// Shared placeholder for modules not yet built — each references the
// requirements doc section covering that module's functional requirements.
export default function ComingSoon({ title, description, docSection }) {
  return (
    <ScreenContainer>
      <View style={styles.wrap}>
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
  wrap: { paddingTop: 40, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.navy, marginBottom: 8 },
  description: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 16 },
  hint: { fontSize: 12, color: colors.accent, textAlign: 'center' },
});
