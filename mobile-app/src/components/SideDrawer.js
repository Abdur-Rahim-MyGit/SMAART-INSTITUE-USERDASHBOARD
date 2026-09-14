/**
 * SideDrawer — slide-in panel from the left.
 *
 * Uses React Native <Modal> with transparent overlay so it reliably overlays
 * native screen containers (react-native-screens / native stack) on Android & iOS.
 *
 * Theming:
 *  - Every colour comes from ThemeContext (`useTheme`), NOT the static
 *    src/theme.js palette. That palette is dark-only, and its `surface` and
 *    `navy` are the same value (#1E293B) — using it painted navy labels on a
 *    navy panel, which made the whole menu unreadable.
 *  - The header keeps the fixed brand navy in both themes (white text on it is
 *    always high-contrast); the body follows the active light/dark theme.
 *
 * Polished UI Features:
 *  - Active route is highlighted (accent bar + tinted row + filled icon tile)
 *    so it is always clear which screen the drawer is sitting on top of
 *  - Status bar top offset so header & Close button clear the clock / notch
 *  - High zIndex & hitSlop on Close ('X') button for 100% tap accuracy
 *  - Slide-in and slide-out custom Animated transitions
 *  - Tapping backdrop (outside overlay) closes the sidebar smoothly
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(310, SCREEN_WIDTH * 0.82);
const ANIM_DURATION = 240;

// Standard top padding offset (Status Bar hidden)
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 24 : 16;

// Brand navy header — intentionally fixed in both themes so the avatar, name,
// email and institution badge always sit on a known dark ground.
const HEADER_BG = '#072036';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

// Deepest focused route across nested navigators (stack -> tabs -> screen).
function activeRouteName(state) {
  if (!state) return null;
  const route = state.routes?.[state.index ?? 0];
  if (!route) return null;
  return route.state ? activeRouteName(route.state) : route.name;
}

/**
 * Current screen name, read off whatever `useNavigation()` handed us.
 *
 * SideDrawer is mounted as a SIBLING of <Stack.Navigator> (see AppStack) so it
 * can overlay the tab bar — it is inside NavigationContainer but NOT inside a
 * navigator screen. That means `useNavigationState()` throws here ("Couldn't
 * get the navigation state"); only the container ref is available, so read the
 * state off it directly and stay tolerant of both shapes.
 */
function resolveCurrentRoute(navigation) {
  if (!navigation) return null;
  try {
    // Container ref (our case) exposes the deepest focused route directly.
    const current = navigation.getCurrentRoute?.();
    if (current?.name) return current.name;
    const state = navigation.getRootState?.() ?? navigation.getState?.();
    return activeRouteName(state);
  } catch (err) {
    // Container not ready yet — no highlight this open, never a crash.
    return null;
  }
}

// ─── Nav section config (mirrors web dashboard sidebar) ─────────────────────
//
// Every `key` below is a real route: `tab: true` keys are MainTabs screens,
// `tab: false` keys are AppStack screens. Keep it that way — an entry pointing
// at a route that doesn't exist is a dead end, and two entries pointing at the
// same route (the old "Placement" + "Skills Passport" pair both opened the
// Career tab) makes the menu read as if screens are missing.

const NAV_SECTIONS = [
  {
    sectionKey: 'main',
    label: 'MAIN MENU',
    items: [
      { key: 'Home',        tab: true,  icon: 'home',        label: 'Dashboard' },
      { key: 'Learning',    tab: true,  icon: 'book-open',   label: 'My Courses' },
      { key: 'Assessments', tab: false, icon: 'edit-3',      label: 'Assessments' },
      { key: 'Toolkit',     tab: false, icon: 'tool',        label: 'Toolkit' },
      { key: 'Career',      tab: true,  icon: 'briefcase',   label: 'Placements' },
      { key: 'Performance', tab: false, icon: 'trending-up', label: 'Performance' },
    ],
  },
  {
    sectionKey: 'skills',
    label: 'SKILLS & GROWTH',
    items: [
      { key: 'SkillsVault',      tab: false, icon: 'award',          label: 'Skills Vault' },
      { key: 'Certificates',     tab: false, icon: 'shield',         label: 'Certificates' },
      { key: 'CareerDirections', tab: false, icon: 'compass',        label: 'Career Directions' },
      { key: 'CareerCoachChat',  tab: false, icon: 'message-circle', label: 'AI Career Coach' },
      { key: 'VisionBoard',      tab: false, icon: 'eye',            label: 'Vision Board' },
    ],
  },
  {
    sectionKey: 'community',
    label: 'COMMUNITY',
    items: [
      { key: 'Community', tab: true, icon: 'users', label: 'Community' },
    ],
  },
  {
    sectionKey: 'account',
    label: 'ACCOUNT',
    items: [
      { key: 'Profile',       tab: true,  icon: 'user', label: 'My Profile' },
      { key: 'Notifications', tab: false, icon: 'bell', label: 'Notifications' },
    ],
  },
  {
    sectionKey: 'system',
    label: 'SYSTEM',
    items: [
      { key: 'Settings',             tab: false, icon: 'settings',     label: 'Settings' },
      { key: 'Support',              tab: false, icon: 'alert-circle', label: 'Grievance Redressal' },
      { key: 'FaceVerificationTest', tab: false, icon: 'camera',       label: 'Face Verification (Beta)' },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SideDrawer({ visible, onClose }) {
  const { user, signOut } = useAuth();
  const { theme, colors: t } = useTheme();
  const navigation = useNavigation();

  const isDark = theme === 'dark';

  // Panel + text colours resolved once per render so every row stays in sync.
  const panelBg      = isDark ? '#0A2942' : '#FFFFFF';
  const labelColor   = isDark ? '#FFFFFF' : '#072036';   // primary menu text
  const tileBg       = isDark ? 'rgba(110,198,234,0.14)' : '#EAF7FD';
  const tileIcon     = isDark ? t.highlight : t.primary;
  const activeBg     = isDark ? 'rgba(110,198,234,0.16)' : 'rgba(4,92,154,0.09)';
  const activeText   = isDark ? t.highlight : t.primary;
  const pressedBg    = isDark ? 'rgba(255,255,255,0.07)' : '#DDEFF8';
  const dangerTileBg = isDark ? 'rgba(239,68,68,0.18)' : '#FEF2F2';

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [isRendered, setIsRendered] = useState(visible);

  // Which row to highlight. Sampled each time the drawer opens rather than
  // subscribed to — the drawer is only on screen between an open and a close,
  // and navigation can't change underneath it while it is up.
  const [currentRoute, setCurrentRoute] = useState(null);

  useEffect(() => {
    if (visible) {
      setCurrentRoute(resolveCurrentRoute(navigation));
    }
  }, [visible, navigation]);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setIsRendered(false);
        }
      });
    }
  }, [visible, translateX, backdropOpacity]);

  if (!isRendered) return null;

  const handleClose = () => {
    onClose();
  };

  const go = (item) => {
    handleClose();
    // Already on this screen — just close instead of re-navigating.
    if (item.key === currentRoute) return;
    setTimeout(() => {
      if (item.tab) {
        navigation.navigate('MainTabs', { screen: item.key });
      } else {
        navigation.navigate(item.key);
      }
    }, 150);
  };

  const handleLogout = async () => {
    handleClose();
    await signOut();
  };

  return (
    <Modal
      visible={isRendered}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Dimmed backdrop pressable */}
        <Pressable style={styles.backdropPressable} onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>

        {/* Sliding panel */}
        <Animated.View
          style={[
            styles.panel,
            { width: DRAWER_WIDTH, backgroundColor: panelBg, transform: [{ translateX }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBlob} pointerEvents="none" />
            <View style={styles.headerBlob2} pointerEvents="none" />

            {/* Exit/Close ('X') button */}
            <Pressable
              onPress={handleClose}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.closeBtnPressed,
              ]}
            >
              <Feather name="x" size={18} color="#FFFFFF" />
            </Pressable>

            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
            </View>

            <Text style={styles.name} numberOfLines={1}>
              {user?.fullName || 'Student'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>

            {(user?.college?.collegeName || user?.college) && (
              <View style={styles.institutionBadge}>
                <Feather name="home" size={11} color="rgba(255,255,255,0.92)" />
                <Text style={styles.institutionBadgeText} numberOfLines={1}>
                  {user?.college?.collegeName || 'Your Institution'}
                </Text>
              </View>
            )}
          </View>

          {/* Nav items */}
          <ScrollView
            contentContainerStyle={styles.navContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {NAV_SECTIONS.map((section, sIdx) => (
              <View key={section.sectionKey}>
                {sIdx > 0 && (
                  <View style={[styles.sectionDivider, { backgroundColor: t.border }]} />
                )}
                <Text style={[styles.sectionLabel, { color: t.textMuted }]}>
                  {section.label}
                </Text>

                {section.items.map((item, iIdx) => {
                  const isActive = item.key === currentRoute;
                  return (
                    <Pressable
                      key={`${section.sectionKey}-${iIdx}`}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                      accessibilityState={{ selected: isActive }}
                      style={({ pressed }) => [
                        styles.item,
                        isActive && { backgroundColor: activeBg },
                        pressed && !isActive && { backgroundColor: pressedBg },
                      ]}
                      onPress={() => go(item)}
                    >
                      {isActive && (
                        <View style={[styles.activeBar, { backgroundColor: activeText }]} />
                      )}
                      <View
                        style={[
                          styles.itemIconWrap,
                          { backgroundColor: isActive ? activeText : tileBg },
                        ]}
                      >
                        <Feather
                          name={item.icon}
                          size={16}
                          color={isActive ? '#FFFFFF' : tileIcon}
                        />
                      </View>
                      <Text
                        style={[
                          styles.itemLabel,
                          { color: isActive ? activeText : labelColor },
                          isActive && styles.itemLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={13}
                        color={isActive ? activeText : t.iconMuted}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {/* Logout */}
            <View style={[styles.sectionDivider, { backgroundColor: t.border }]} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out"
              style={({ pressed }) => [
                styles.item,
                pressed && { backgroundColor: dangerTileBg },
              ]}
              onPress={handleLogout}
            >
              <View style={[styles.itemIconWrap, { backgroundColor: dangerTileBg }]}>
                <Feather name="log-out" size={16} color={t.danger} />
              </View>
              <Text style={[styles.itemLabel, { color: t.danger }]}>Log Out</Text>
            </Pressable>

            <Text style={[styles.footerNote, { color: t.textMuted }]}>
              SMAART Institute v1.0
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Layout only. Anything colour-bearing that depends on light/dark is applied
// inline from the resolved theme values above.

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,16,28,0.66)',
  },
  panel: {
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },

  // Header
  header: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 14,
    paddingBottom: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  headerBlob: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(166,215,232,0.16)',
    top: -50,
    right: -40,
  },
  headerBlob2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(4,92,154,0.45)',
    bottom: -20,
    left: -20,
  },
  closeBtn: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 10,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    elevation: 99,
  },
  closeBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  email: { fontSize: 12, color: 'rgba(255,255,255,0.78)', fontWeight: '500' },
  institutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    maxWidth: '96%',
  },
  institutionBadgeText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 10.5,
    fontWeight: '700',
    marginLeft: 6,
    flexShrink: 1,
  },

  // Nav
  navContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 6,
    textTransform: 'uppercase',
  },
  sectionDivider: {
    height: 1,
    marginVertical: 6,
    marginHorizontal: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    position: 'relative',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  itemLabelActive: {
    fontWeight: '800',
  },

  footerNote: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 0.3,
  },
});
