import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import AppTextInput from '../../components/AppTextInput';
import { getColleges } from '../../api/colleges';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme';

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
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.header}>
        <Image source={require('../../../assets/smaart-logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Select your Institution</Text>
        <Text style={styles.subtitle}>Find your college to continue to login.</Text>
      </View>

      <AppTextInput
        icon="search"
        placeholder="Search college..."
        value={search}
        onChangeText={setSearch}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={15} color={colors.danger} />
          <Text style={styles.errorText}>
            Couldn't load colleges: {error}{'\n'}Check EXPO_PUBLIC_API_URL in mobile-app/.env points at your running backend.
          </Text>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        ListEmptyComponent={!loading && !error ? <Text style={styles.muted}>No colleges found.</Text> : null}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => selectCollege(item)}
          >
            <View style={styles.cardIcon}>
              <Feather name="home" size={17} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.collegeName}</Text>
              {item.address ? (
                <Text style={styles.cardSubtitle}>
                  {[item.address.city, item.address.state].filter(Boolean).join(', ')}
                </Text>
              ) : null}
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedLight} />
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 12 },
  header: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 184, height: 62, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '800', color: colors.navy, letterSpacing: -0.4, marginTop: 4 },
  subtitle: { fontSize: 13, fontWeight: '500', color: colors.muted, marginTop: 4 },
  muted: { color: colors.muted, marginTop: 20, textAlign: 'center' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 10,
    ...shadow.card,
    shadowOpacity: 0.04,
  },
  cardPressed: { opacity: 0.9, backgroundColor: colors.surfaceMuted },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 12, fontWeight: '500', color: colors.muted, marginTop: 2 },
});
