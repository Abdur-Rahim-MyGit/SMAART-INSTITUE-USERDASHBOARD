import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScreenContainer>
      <Text style={styles.greeting}>Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} 👋</Text>
      <Text style={styles.subtitle}>You're logged in and talking to the real backend.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Session</Text>
        <Text style={styles.row}>Email: {user?.email || '—'}</Text>
        <Text style={styles.row}>Role: {user?.role || user?.userType || '—'}</Text>
        <Text style={styles.row}>College: {user?.college?.collegeName || '—'}</Text>
      </View>

      <Text style={styles.note}>
        This dashboard tab, plus Assessments / Learning / Career / Community, are placeholders ready to be built out
        phase-by-phase per the roadmap in docs/04-React-Native-App-Requirements-and-Roadmap.docx.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: '700', color: colors.navy, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 20 },
  card: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: colors.grey,
    borderWidth: 1,
    borderColor: colors.light,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  row: { fontSize: 14, color: colors.text, marginBottom: 4 },
  note: { fontSize: 12, color: colors.muted, lineHeight: 18 },
});
