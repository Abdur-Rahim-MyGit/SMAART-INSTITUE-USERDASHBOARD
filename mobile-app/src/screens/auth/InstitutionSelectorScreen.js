import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import AppTextInput from '../../components/AppTextInput';
import { getColleges } from '../../api/colleges';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

// FR-AUTH-01 — first-run screen: pick a college before anything else.
export default function InstitutionSelectorScreen({ navigation }) {
  const { setCollege } = useAuth();
  const [search, setSearch] = useState('');
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getColleges()
      .then((res) => {
        if (active) setColleges(res.data || []);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const filtered = search
    ? colleges.filter((c) => c.collegeName?.toLowerCase().includes(search.toLowerCase()))
    : colleges;

  const selectCollege = (college) => {
    setCollege(college);
    navigation.navigate('Login');
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Select your Institution</Text>
      <Text style={styles.subtitle}>Choose your college to continue to login.</Text>
      <AppTextInput placeholder="Search college..." value={search} onChangeText={setSearch} />

      {error ? (
        <Text style={styles.errorText}>
          Couldn't load colleges: {error}{'\n'}Check EXPO_PUBLIC_API_URL in mobile-app/.env points at your running backend.
        </Text>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        ListEmptyComponent={!loading && !error ? <Text style={styles.muted}>No colleges found.</Text> : null}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => selectCollege(item)}>
            <Text style={styles.cardTitle}>{item.collegeName}</Text>
            {item.address ? <Text style={styles.cardSubtitle}>{item.address}</Text> : null}
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.navy, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 20 },
  muted: { color: colors.muted, marginTop: 20, textAlign: 'center' },
  errorText: { color: colors.danger, marginBottom: 12 },
  card: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.light,
    backgroundColor: colors.grey,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
