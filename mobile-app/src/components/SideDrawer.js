/**
 * SideDrawer — slide-in panel from the left.
 *
 * Uses React Native <Modal> with transparent overlay so it reliably overlays
 * native screen containers (react-native-screens / native stack) on Android & iOS.
 *
 * Polished UI Features:
 *  - Status bar top offset (`StatusBar.currentHeight` on Android) so header & Exit button sit below system clock / camera notch
 *  - High zIndex & hitSlop on Close ('X') button for 100% tap accuracy
 *  - Clean section headers, pill badges, and active press feedback
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
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, radius, shadow } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(310, SCREEN_WIDTH * 0.82);
const ANIM_DURATION = 240;

// Standard top padding offset (Status Bar hidden)
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 24 : 16;

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

// ─── Nav section config (mirrors web dashboard sidebar) ─────────────────────

const NAV_SECTIONS = [
  {
    sectionKey: 'main',
    label: 'MAIN MENU',
    items: [
      { key: 'Home',        tab: true,  icon: 'home',        label: 'Dashboard' },
      { key: 'Learning',    tab: true,  icon: 'book-open',   label: 'My Courses' },
      { key: 'Assessments', tab: false, icon: 'edit-3',      label: 'Assessments' },
      { key: 'Toolkit',     tab: false, icon: 'tool',        label: 'Toolkit' },
      { key: 'Career',      tab: true,  icon: 'briefcase',   label: 'Placement' },
      { key: 'Performance', tab: false, icon: 'trending-up', label: 'Performance' },
    ],
  },
  {
    sectionKey: 'skills',
    label: 'SKILLS & GROWTH',
    items: [
      { key: 'SkillsVault',       tab: false, icon: 'award',    label: 'Skills Vault' },
      { key: 'CareerDirections',  tab: false, icon: 'compass',  label: 'Career Directions' },
      { key: 'Career',            tab: true,  icon: 'shield',   label: 'Skills Passport' },
      { key: 'VisionBoard',       tab: false, icon: 'eye',      label: 'Vision Board' },
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
      { key: 'Profile',       tab: true,  icon: 'user',       label: 'My Profile' },
      { key: 'Notifications', tab: false, icon: 'bell',       label: 'Notifications' },
    ],
  },
  {
    sectionKey: 'system',
    label: 'SYSTEM',
    items: [
      { key: 'Settings',             tab: false, icon: 'settings',     label: 'Settings' },
      { key: 'Support',              tab: false, icon: 'life-buoy',    label: 'Help & Grievances' },
      { key: 'FaceVerificationTest', tab: false, icon: 'camera',       label: 'Face Verification (Beta)' },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SideDrawer({ visible, onClose }) {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [isRendered, setIsRendered] = useState(visible);

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
          style={[styles.panel, { width: DRAWER_WIDTH, transform: [{ translateX }] }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBlob} pointerEvents="none" />
            <View style={styles.headerBlob2} pointerEvents="none" />

            {/* Exit/Close ('X') button */}
            <Pressable
              onPress={handleClose}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.closeBtnPressed,
              ]}
            >
              <Feather name="x" size={18} color="rgba(255,255,255,0.95)" />
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
                <Feather name="home" size={11} color="rgba(255,255,255,0.85)" />
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
                {sIdx > 0 && <View style={styles.sectionDivider} />}
                <Text style={styles.sectionLabel}>{section.label}</Text>

                {section.items.map((item, iIdx) => (
                  <Pressable
                    key={`${section.sectionKey}-${iIdx}`}
                    style={({ pressed }) => [
                      styles.item,
                      pressed && styles.itemPressed,
                    ]}
                    onPress={() => go(item)}
                  >
                    <View style={styles.itemIconWrap}>
                      <Feather name={item.icon} size={16} color={colors.navy} />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Feather name="chevron-right" size={13} color={colors.mutedLight} />
                  </Pressable>
                ))}
              </View>
            ))}

            {/* Logout */}
            <View style={styles.sectionDivider} />
            <Pressable
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={handleLogout}
            >
              <View style={[styles.itemIconWrap, styles.itemIconDanger]}>
                <Feather name="log-out" size={16} color={colors.danger} />
              </View>
              <Text style={[styles.itemLabel, styles.logoutLabel]}>Log Out</Text>
            </Pressable>

            <Text style={styles.footerNote}>SMAART Institute v1.0</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    backgroundColor: 'rgba(15,23,42,0.65)',
  },
  panel: {
    height: '100%',
    backgroundColor: colors.surface,
    ...shadow.card,
    shadowOpacity: 0.25,
    shadowColor: '#000',
    elevation: 16,
  },

  // Header
  header: {
    backgroundColor: colors.navy,
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
    backgroundColor: 'rgba(59,130,246,0.2)',
    top: -50,
    right: -40,
  },
  headerBlob2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(26,56,132,0.5)',
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
  avatarText: { color: colors.white, fontSize: 17, fontWeight: '800' },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  email: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  institutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    maxWidth: '96%',
  },
  institutionBadgeText: {
    color: 'rgba(255,255,255,0.85)',
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
    color: colors.muted,
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 6,
    textTransform: 'uppercase',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
    marginHorizontal: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  itemPressed: { backgroundColor: '#F1F5F9' },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  itemIconDanger: { backgroundColor: '#FEF2F2' },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  logoutLabel: { color: colors.danger },

  footerNote: {
    fontSize: 10,
    color: colors.mutedLight,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 0.3,
  },
});
