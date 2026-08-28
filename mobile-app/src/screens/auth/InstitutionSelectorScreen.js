/**
 * InstitutionSelectorScreen — Minimal, Modern Search College Screen.
 *
 * Key Improvements:
 *  - Removed Quick Search chips completely
 *  - Matches the onboarding theme (Dark Header + White Curved Body)
 *  - Full KeyboardAvoidingView support so keyboard never covers UI elements
 *  - Instant search filtering with clear ('X') button
 *  - Displays full college list directly so users can browse OR search
 *  - Smooth card press selection navigating directly to Sign In (LoginScreen)
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { getColleges } from '../../api/colleges';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme';
import { FadeSlideIn, PressScale } from '../../components/Motion';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 24 : 16;

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

  const filtered = search.trim()
    ? colleges.filter((c) => {
      const query = search.toLowerCase();
      const name = c.collegeName?.toLowerCase() || '';
      const code = c.collegeCode?.toLowerCase() || '';
      const city = c.address?.city?.toLowerCase() || '';
      const state = c.address?.state?.toLowerCase() || '';
      return name.includes(query) || code.includes(query) || city.includes(query) || state.includes(query);
    })
    : [];

  const selectCollege = (college) => {
    setCollege(college);
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.navyDark} />

      {/* Dark Top Header */}
      <FadeSlideIn duration={380}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.title}>Select Your College</Text>
          <Text style={styles.subtitle}>Find your institution to continue to Sign In</Text>
        </View>
      </FadeSlideIn>

      {/* White Curved Sheet Container with Keyboard Avoiding View */}
      <KeyboardAvoidingView
        style={styles.sheetContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FadeSlideIn duration={420} delay={90} style={{ flex: 1 }}>
        <View style={styles.sheetContent}>
          {/* Custom Pill Search Input */}
          <View style={styles.searchBarWrap}>
            <Feather name="search" size={18} color={colors.primaryBright} style={styles.searchIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Search college name, code, or city..."
              placeholderTextColor={colors.mutedLight}
              value={search}
              onChangeText={setSearch}
              autoFocus={false}
            />
            {search.length > 0 && (
              <Pressable
                style={styles.clearBtn}
                onPress={() => setSearch('')}
                hitSlop={8}
              >
                <Feather name="x-circle" size={18} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color={colors.primaryBright} />
            </View>
          )}

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>
                Couldn't load colleges: {error}{'\n'}Ensure EXPO_PUBLIC_API_URL points to running backend.
              </Text>
            </View>
          ) : null}

          {/* College Results List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id || item.id || item.collegeCode}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listPadding}
            ListEmptyComponent={
              !loading && !error ? (
                search.trim() === '' ? (
                  <View style={styles.emptyStateBox}>
                    <Feather name="search" size={28} color={colors.mutedLight} />
                    <Text style={styles.emptyTitle}>Type to find your college</Text>
                    <Text style={styles.emptySubtitle}>
                      Enter your institution name, code, or city to get started.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyStateBox}>
                    <Feather name="alert-circle" size={28} color={colors.mutedLight} />
                    <Text style={styles.emptyTitle}>No matching college found</Text>
                    <Text style={styles.emptySubtitle}>
                      Check spelling or try searching by city or college code.
                    </Text>
                  </View>
                )
              ) : null
            }
            renderItem={({ item }) => (
              <PressScale
                style={styles.collegeCard}
                pressedStyle={styles.collegeCardPressed}
                scaleTo={0.98}
                onPress={() => selectCollege(item)}
              >
                <View style={styles.collegeIconWrap}>
                  <Feather name="home" size={18} color={colors.primaryBright} />
                </View>

                <View style={styles.collegeInfo}>
                  <Text style={styles.collegeName} numberOfLines={2}>
                    {item.collegeName}
                  </Text>
                  {item.address?.city || item.address?.state ? (
                    <Text style={styles.collegeLocation} numberOfLines={1}>
                      {[item.address?.city, item.address?.state].filter(Boolean).join(', ')}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.selectAction}>
                  <Text style={styles.selectText}>Select</Text>
                  <Feather name="chevron-right" size={16} color={colors.primaryBright} />
                </View>
              </PressScale>
            )}
          />
        </View>
        </FadeSlideIn>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDark,
  },

  // Dark Top Header
  header: {
    paddingHorizontal: 24,
    paddingTop: STATUS_BAR_HEIGHT + 14,
    paddingBottom: 28,
    backgroundColor: colors.navyDark,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 6,
  },

  // White Curved Body Sheet
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
  },

  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
  },
  searchIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 0,
  },
  clearBtn: {
    marginLeft: 6,
  },

  loaderRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },

  // List & Cards
  listPadding: {
    paddingBottom: 32,
  },
  collegeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 10,
    ...shadow.card,
    shadowOpacity: 0.04,
  },
  collegeCardPressed: {
    backgroundColor: '#EAF7FD',
    borderColor: colors.primaryBright,
  },
  collegeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: '#EAF7FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  collegeInfo: {
    flex: 1,
    marginRight: 10,
  },
  collegeName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.navy,
    lineHeight: 20,
  },
  collegeLocation: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.muted,
    marginTop: 3,
  },

  selectAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7FD',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryBright,
    marginRight: 2,
  },

  // Empty State
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
