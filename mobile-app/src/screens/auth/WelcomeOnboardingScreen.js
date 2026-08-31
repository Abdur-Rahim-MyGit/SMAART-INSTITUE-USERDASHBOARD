/**
 * WelcomeOnboardingScreen â€” 5-slide pre-login onboarding.
 *
 * Slides:
 *   0 â€” Learn Anytime, Anywhere     (SVG illustrations)
 *   1 â€” Earn Streaks & Rewards
 *   2 â€” Secure Access & Seamless
 *   3 â€” Career Agent
 *   4 â€” Set Up Your Experience (real OS permissions)
 *
 * Light + Dark theme via ThemeContext. SVGs are inline.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Polyline,
  Rect,
  Stop,
} from 'react-native-svg';
import { useCameraPermission } from 'react-native-vision-camera';
import * as Notifications from 'expo-notifications';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadow } from '../../theme';
import * as storage from '../../utils/storage';
import { getBiometricCapability, promptBiometric } from '../../utils/biometrics';
import { PressScale } from '../../components/Motion';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_COUNT = 5;
const TAG_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'à¤¹à¤¿à¤‚à¤¦à¥€' },
  { code: 'ta', label: 'à®¤à®®à®¿à®´à¯' },
  { code: 'te', label: 'à°¤à±†à°²à±à°—à±' },
  { code: 'ur', label: 'Ø§Ø±Ø¯Ùˆ' },
];

const TRANSLATIONS = {
  en: {
    next: 'Next Slide', finish: 'Continue to Sign In', skip: 'Skip Introduction',
    prefTitle: 'App Preferences', languageLabel: 'Select Language',
    themeLabel: 'Theme Mode', lightMode: 'Light Mode', darkMode: 'Dark Mode',
    apply: 'Apply Preferences', granted: 'Granted', grant: 'Grant',
    optional: 'Optional', enabled: 'Enabled', enable: 'Enable', active: 'Active',
    notifyLabel: 'Push Alerts',
    slides: [
      { tag: 'LEARN', title: 'Learn Anytime,\nAnywhere',
        desc: 'Access your courses & assessments at your own pace. Get placement-ready with structured learning that fits your schedule.' },
      { tag: 'REWARDS', title: 'Earn Streaks\n& Rewards',
        desc: 'Show up daily, earn XP points, and unlock your personal Vision Board. Consistency turns into achievement.' },
      { tag: 'SECURE', title: 'Secure Access &\nSeamless Experience',
        desc: 'Face-verified proctored exams with on-device AI. Biometric unlock for instant, password-free access. Privacy-first.' },
      { tag: 'AI', title: 'Meet Your\nCareer Agent',
        desc: 'Your personal AI mentor scouts jobs, builds your resume, tracks placement readiness, and keeps you one step ahead â€” 24/7.' },
      { tag: 'SETUP', title: 'Set Up Your\nExperience',
        desc: 'Grant the permissions that power SMAART smart features. You can update these anytime in Settings.' },
    ],
  },
  hi: {
    next: 'à¤…à¤—à¤²à¥€ à¤¸à¥à¤²à¤¾à¤‡à¤¡', finish: 'à¤²à¥‰à¤—à¤¿à¤¨ à¤ªà¤° à¤œà¤¾à¤à¤‚', skip: 'à¤›à¥‹à¤¡à¤¼à¥‡à¤‚',
    prefTitle: 'à¤à¤ª à¤ªà¥à¤°à¤¾à¤¥à¤®à¤¿à¤•à¤¤à¤¾à¤à¤‚', languageLabel: 'à¤­à¤¾à¤·à¤¾ à¤šà¥à¤¨à¥‡à¤‚',
    themeLabel: 'à¤¥à¥€à¤® à¤®à¥‹à¤¡', lightMode: 'à¤²à¤¾à¤‡à¤Ÿ à¤®à¥‹à¤¡', darkMode: 'à¤¡à¤¾à¤°à¥à¤• à¤®à¥‹à¤¡',
    apply: 'à¤²à¤¾à¤—à¥‚ à¤•à¤°à¥‡à¤‚', granted: 'à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤', grant: 'à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¦à¥‡à¤‚',
    optional: 'à¤µà¥ˆà¤•à¤²à¥à¤ªà¤¿à¤•', enabled: 'à¤¸à¤•à¥à¤·à¤®', enable: 'à¤¸à¤•à¥à¤·à¤® à¤•à¤°à¥‡à¤‚', active: 'à¤¸à¤•à¥à¤°à¤¿à¤¯',
    notifyLabel: 'à¤ªà¥à¤¶ à¤¨à¥‹à¤Ÿà¤¿à¤«à¤¿à¤•à¥‡à¤¶à¤¨',
    slides: [
      { tag: 'LEARN', title: 'à¤•à¤­à¥€ à¤­à¥€, à¤•à¤¹à¥€à¤‚ à¤­à¥€\nà¤¸à¥€à¤–à¥‡à¤‚', desc: 'à¤…à¤ªà¤¨à¥€ à¤—à¤¤à¤¿ à¤¸à¥‡ à¤•à¥‹à¤°à¥à¤¸ à¤à¤•à¥à¤¸à¥‡à¤¸ à¤•à¤°à¥‡à¤‚à¥¤ à¤ªà¥à¤²à¥‡à¤¸à¤®à¥‡à¤‚à¤Ÿ à¤•à¥‡ à¤²à¤¿à¤ à¤¤à¥ˆà¤¯à¤¾à¤° à¤¹à¥‹à¤‚à¥¤' },
      { tag: 'REWARDS', title: 'à¤¸à¥à¤Ÿà¥à¤°à¥€à¤•à¥à¤¸ à¤”à¤°\nà¤ªà¥à¤°à¤¸à¥à¤•à¤¾à¤° à¤•à¤®à¤¾à¤à¤‚', desc: 'à¤°à¥‹à¤œà¤¼ XP à¤•à¤®à¤¾à¤à¤‚, à¤µà¤¿à¤œà¤¼à¤¨ à¤¬à¥‹à¤°à¥à¤¡ à¤…à¤¨à¤²à¥‰à¤• à¤•à¤°à¥‡à¤‚à¥¤' },
      { tag: 'SECURE', title: 'à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤à¤µà¤‚\nà¤¸à¤¹à¤œ à¤…à¤¨à¥à¤­à¤µ', desc: 'AI à¤ªà¥à¤°à¥‰à¤•à¥à¤Ÿà¤°à¤¿à¤‚à¤— à¤”à¤° à¤¬à¤¾à¤¯à¥‹à¤®à¥‡à¤Ÿà¥à¤°à¤¿à¤• à¤…à¤¨à¤²à¥‰à¤•à¥¤' },
      { tag: 'AI', title: 'à¤†à¤ªà¤•à¤¾\nà¤•à¥ˆà¤°à¤¿à¤¯à¤° à¤à¤œà¥‡à¤‚à¤Ÿ', desc: 'AI à¤®à¥‡à¤‚à¤Ÿà¤° à¤¨à¥Œà¤•à¤°à¤¿à¤¯à¤¾à¤‚ à¤–à¥‹à¤œà¤¤à¤¾ à¤¹à¥ˆ à¤”à¤° à¤†à¤ªà¤•à¥€ à¤¤à¥ˆà¤¯à¤¾à¤°à¥€ à¤Ÿà¥à¤°à¥ˆà¤• à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤' },
      { tag: 'SETUP', title: 'à¤…à¤¨à¥à¤­à¤µ\nà¤¸à¥‡à¤Ÿ à¤•à¤°à¥‡à¤‚', desc: 'SMAART à¤¸à¥à¤µà¤¿à¤§à¤¾à¤“à¤‚ à¤•à¥‡ à¤²à¤¿à¤ à¤…à¤¨à¥à¤®à¤¤à¤¿à¤¯à¤¾à¤‚ à¤¦à¥‡à¤‚à¥¤' },
    ],
  },
  ta: {
    next: 'à®…à®Ÿà¯à®¤à¯à®¤à¯', finish: 'à®‰à®³à¯à®¨à¯à®´à¯ˆà®¯ à®šà¯†à®²à¯à®²à®µà¯à®®à¯', skip: 'à®¤à®µà®¿à®°à¯à®•à¯à®•à®µà¯à®®à¯',
    prefTitle: 'à®µà®¿à®°à¯à®ªà¯à®ªà®¤à¯à®¤à¯‡à®°à¯à®µà¯à®•à®³à¯', languageLabel: 'à®®à¯Šà®´à®¿',
    themeLabel: 'à®¤à¯€à®®à¯', lightMode: 'à®²à¯ˆà®Ÿà¯', darkMode: 'à®Ÿà®¾à®°à¯à®•à¯',
    apply: 'à®ªà®¯à®©à¯à®ªà®Ÿà¯à®¤à¯à®¤à¯à®•', granted: 'à®…à®©à¯à®®à®¤à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯', grant: 'à®…à®©à¯à®®à®¤à®¿',
    optional: 'à®µà®¿à®°à¯à®ªà¯à®ªà®®à¯', enabled: 'à®šà¯†à®¯à®²à¯à®ªà®Ÿà¯à®Ÿà®¤à¯', enable: 'à®šà¯†à®¯à®²à¯à®ªà®Ÿà¯à®¤à¯à®¤à¯', active: 'à®šà¯†à®¯à®²à®¿à®²à¯',
    notifyLabel: 'à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯à®•à®³à¯',
    slides: [
      { tag: 'LEARN', title: 'à®Žà®™à¯à®•à¯à®®à¯\nà®•à®±à¯à®±à¯à®•à¯à®•à¯Šà®³à¯à®³à¯à®™à¯à®•à®³à¯', desc: 'à®‰à®™à¯à®•à®³à¯ à®µà¯‡à®•à®¤à¯à®¤à®¿à®²à¯ à®•à®±à¯à®±à¯ à®µà¯‡à®²à¯ˆ à®µà®¾à®¯à¯à®ªà¯à®ªà®¿à®±à¯à®•à¯ à®¤à®¯à®¾à®°à®¾à®•à¯à®™à¯à®•à®³à¯.' },
      { tag: 'REWARDS', title: 'à®¸à¯à®Ÿà¯à®°à¯€à®•à¯\nà®ªà®°à®¿à®šà¯à®•à®³à¯', desc: 'XP à®šà®®à¯à®ªà®¾à®°à®¿à®¤à¯à®¤à¯ à®µà®¿à®·à®©à¯ à®ªà¯‹à®°à¯à®Ÿà¯ˆ à®¤à®¿à®±à®™à¯à®•à®³à¯.' },
      { tag: 'SECURE', title: 'à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®©\nà®…à®©à¯à®ªà®µà®®à¯', desc: 'AI à®ªà¯à®°à¯‹à®•à¯à®Ÿà®°à®¿à®™à¯ à®®à®±à¯à®±à¯à®®à¯ à®ªà®¯à¯‹à®®à¯†à®Ÿà¯à®°à®¿à®•à¯ à®…à®£à¯à®•à®²à¯.' },
      { tag: 'AI', title: 'à®•à®°à®¿à®¯à®°à¯\nà®à®œà¯†à®©à¯à®Ÿà¯', desc: 'AI à®µà®´à®¿à®•à®¾à®Ÿà¯à®Ÿà®¿ à®µà¯‡à®²à¯ˆ à®¤à¯‡à®Ÿà¯à®®à¯, 24/7 à®•à®£à¯à®•à®¾à®£à®¿à®•à¯à®•à¯à®®à¯.' },
      { tag: 'SETUP', title: 'à®…à®©à¯à®®à®¤à®¿à®•à®³à¯ˆ\nà®µà®´à®™à¯à®•à¯à®™à¯à®•à®³à¯', desc: 'SMAART à®…à®®à¯à®šà®™à¯à®•à®³à¯ˆ à®šà¯†à®¯à®²à¯à®ªà®Ÿà¯à®¤à¯à®¤ à®…à®©à¯à®®à®¤à®¿à®•à®³à¯ˆ à®µà®´à®™à¯à®•à¯à®™à¯à®•à®³à¯.' },
    ],
  },
  te: {
    next: 'à°¤à°¦à±à°ªà°°à°¿', finish: 'à°²à°¾à°—à°¿à°¨à± à°…à°µà±à°µà°‚à°¡à°¿', skip: 'à°¦à°¾à°Ÿà°µà±‡à°¯à°¿',
    prefTitle: 'à°ªà±à°°à°¾à°§à°¾à°¨à±à°¯à°¤à°²à±', languageLabel: 'à°­à°¾à°·',
    themeLabel: 'à°¥à±€à°®à±', lightMode: 'à°²à±ˆà°Ÿà±', darkMode: 'à°¡à°¾à°°à±à°•à±',
    apply: 'à°µà°°à±à°¤à°¿à°‚à°ªà°œà±‡à°¯à°¿', granted: 'à°…à°¨à±à°®à°¤à°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿', grant: 'à°…à°¨à±à°®à°¤à°¿',
    optional: 'à°à°šà±à°›à°¿à°•à°‚', enabled: 'à°ªà±à°°à°¾à°°à°‚à°­à°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿', enable: 'à°ªà±à°°à°¾à°°à°‚à°­à°¿à°‚à°šà±', active: 'à°¸à°•à±à°°à°¿à°¯à°‚à°—à°¾',
    notifyLabel: 'à°¨à±‹à°Ÿà°¿à°«à°¿à°•à±‡à°·à°¨à±à°²à±',
    slides: [
      { tag: 'LEARN', title: 'à°Žà°ªà±à°ªà±à°¡à±ˆà°¨à°¾\nà°¨à±‡à°°à±à°šà±à°•à±‹à°‚à°¡à°¿', desc: 'à°®à±€ à°µà±‡à°—à°‚à°²à±‹ à°•à±‹à°°à±à°¸à±à°²à± à°¯à°¾à°•à±à°¸à±†à°¸à± à°šà±‡à°¸à°¿ à°ªà±à°²à±‡à°¸à±â€Œà°®à±†à°‚à°Ÿà±â€Œà°•à± à°¸à°¿à°¦à±à°§à°‚à°—à°¾ à°‰à°‚à°¡à°‚à°¡à°¿.' },
      { tag: 'REWARDS', title: 'à°¸à±à°Ÿà±à°°à±€à°•à±à°¸à±\nà°°à°¿à°µà°¾à°°à±à°¡à±à°²à±', desc: 'XP à°¸à°‚à°ªà°¾à°¦à°¿à°‚à°šà°¿ à°µà°¿à°œà°¨à± à°¬à±‹à°°à±à°¡à± à°…à°¨à±â€Œà°²à°¾à°•à± à°šà±‡à°¯à°‚à°¡à°¿.' },
      { tag: 'SECURE', title: 'à°¸à±à°°à°•à±à°·à°¿à°¤\nà°…à°¨à±à°­à°µà°‚', desc: 'AI à°ªà±à°°à°¾à°•à±à°Ÿà°°à°¿à°‚à°—à± à°®à°°à°¿à°¯à± à°¬à°¯à±‹à°®à±†à°Ÿà±à°°à°¿à°•à± à°…à°¨à±à°­à°µà°‚.' },
      { tag: 'AI', title: 'à°•à±†à°°à±€à°°à±\nà°à°œà±†à°‚à°Ÿà±', desc: 'AI à°®à±†à°‚à°Ÿà°°à± à°‰à°¦à±à°¯à±‹à°—à°¾à°²à± à°µà±†à°¤à±à°•à±à°¤à±à°‚à°¦à°¿, 24/7 à°Ÿà±à°°à°¾à°•à± à°šà±‡à°¸à±à°¤à±à°‚à°¦à°¿.' },
      { tag: 'SETUP', title: 'à°…à°¨à±à°­à°µà°¾à°¨à±à°¨à°¿\nà°¸à±†à°Ÿà°ªà± à°šà±‡à°¯à°‚à°¡à°¿', desc: 'SMAART à°¸à±à°®à°¾à°°à±à°Ÿà± à°«à±€à°šà°°à±à°²à°•à± à°…à°¨à±à°®à°¤à±à°²à± à°®à°‚à°œà±‚à°°à± à°šà±‡à°¯à°‚à°¡à°¿.' },
    ],
  },
  ur: {
    next: 'Ø§Ú¯Ù„ÛŒ Ø³Ù„Ø§Ø¦ÛŒÚˆ', finish: 'Ø³Ø§Ø¦Ù† Ø§Ù† Ú©Ø±ÛŒÚº', skip: 'Ú†Ú¾ÙˆÚ‘ÛŒÚº',
    prefTitle: 'ØªØ±Ø¬ÛŒØ­Ø§Øª', languageLabel: 'Ø²Ø¨Ø§Ù†',
    themeLabel: 'ØªÚ¾ÛŒÙ…', lightMode: 'Ù„Ø§Ø¦Ù¹', darkMode: 'ÚˆØ§Ø±Ú©',
    apply: 'Ù„Ø§Ú¯Ùˆ Ú©Ø±ÛŒÚº', granted: 'Ù…Ù†Ø¸ÙˆØ±', grant: 'Ø§Ø¬Ø§Ø²Øª',
    optional: 'Ø§Ø®ØªÛŒØ§Ø±ÛŒ', enabled: 'ÙØ¹Ø§Ù„', enable: 'ÙØ¹Ø§Ù„ Ú©Ø±ÛŒÚº', active: 'Ø³Ø±Ú¯Ø±Ù…',
    notifyLabel: 'Ø§Ø·Ù„Ø§Ø¹Ø§Øª',
    slides: [
      { tag: 'LEARN', title: 'Ú©ÛÛŒÚº Ø¨Ú¾ÛŒ\nØ³ÛŒÚ©Ú¾ÛŒÚº', desc: 'Ø§Ù¾Ù†ÛŒ Ø±ÙØªØ§Ø± Ø³Û’ Ú©ÙˆØ±Ø³Ø² ÛŒØ§Ú© Ø³ÛŒØ³ Ú©Ø±ÛŒÚºÛ” Ù¾Ù„ÛŒØ³Ù…Ù†Ù¹ Ú©Û’ Ù„ÛŒÛ’ ØªÛŒØ§Ø± ÛÙˆÚºÛ”' },
      { tag: 'REWARDS', title: 'Ø§Ø³Ù¹Ø±ÛŒÚ©Ø³\nØ§Ù†Ø¹Ø§Ù…Ø§Øª', desc: 'Ø±ÙˆØ²Ø§Ù†Û XP Ú©Ù…Ø§Ø¦ÛŒÚºØŒ ÙˆÛŒÚ˜Ù† Ø¨ÙˆØ±Úˆ Ú©Ú¾ÙˆÙ„ÛŒÚºÛ”' },
      { tag: 'SECURE', title: 'Ù…Ø­ÙÙˆØ¸\nØªØ¬Ø±Ø¨Û', desc: 'AI Ù¾Ø±ÙˆÚ©Ù¹Ø±Ù†Ú¯ Ø§ÙˆØ± Ø¨Ø§ÛŒÙˆÙ…ÛŒÙ¹Ø±Ú© â€” Ø±Ø§Ø²Ø¯Ø§Ø±ÛŒ Ù¾ÛÙ„Û’Û”' },
      { tag: 'AI', title: 'Ú©ÛŒØ±ÛŒØ¦Ø±\nØ§ÛŒØ¬Ù†Ù¹', desc: 'AI Ø±ÛÙ†Ù…Ø§ Ù†ÙˆÚ©Ø±ÛŒØ§Úº ÚˆÚ¾ÙˆÙ†ÚˆØªØ§ Ø§ÙˆØ± 24/7 Ù†Ú¯Ø±Ø§Ù†ÛŒ Ú©Ø±ØªØ§ ÛÛ’Û”' },
      { tag: 'SETUP', title: 'ØªØ¬Ø±Ø¨Û\nØªØ±ØªÛŒØ¨ Ø¯ÛŒÚº', desc: 'SMAART Ø®ØµÙˆØµÛŒØ§Øª Ú©Û’ Ù„ÛŒÛ’ Ø§Ø¬Ø§Ø²ØªÛŒÚº Ø¯ÛŒÚºÛ”' },
    ],
  },
};

// â”€â”€â”€ SVG Illustrations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function IllustrationLearn({ dark }) {
  const accent = '#3B82F6';
  const accent2 = '#60A5FA';
  const textFill = dark ? '#CBD5E1' : '#1E40AF';
  return (
    <Svg width="220" height="190" viewBox="0 0 220 190">
      <Defs>
        <LinearGradient id="scrG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={accent} stopOpacity="0.18" />
          <Stop offset="1" stopColor={accent} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Rect x="20" y="148" width="180" height="10" rx="4" fill={dark ? '#334155' : '#BFDBFE'} />
      <Rect x="55" y="132" width="110" height="18" rx="5" fill={dark ? '#475569' : '#93C5FD'} />
      <Rect x="60" y="58" width="100" height="76" rx="7" fill={dark ? '#0F172A' : '#DBEAFE'} />
      <Rect x="62" y="60" width="96" height="72" rx="5" fill="url(#scrG)" />
      <Rect x="72" y="70" width="50" height="5" rx="2" fill={accent} opacity="0.8" />
      <Rect x="72" y="80" width="76" height="3" rx="1.5" fill={textFill} opacity="0.35" />
      <Rect x="72" y="87" width="60" height="3" rx="1.5" fill={textFill} opacity="0.25" />
      <Rect x="72" y="94" width="70" height="3" rx="1.5" fill={textFill} opacity="0.2" />
      <Circle cx="138" cy="90" r="13" fill={accent} opacity="0.9" />
      <Polygon points="134,84 134,96 145,90" fill="#fff" />
      <G transform="rotate(-12, 32, 96)">
        <Rect x="18" y="88" width="28" height="38" rx="3" fill={accent} opacity="0.85" />
        <Rect x="23" y="95" width="18" height="3" rx="1" fill="#fff" opacity="0.6" />
        <Rect x="23" y="102" width="14" height="2" rx="1" fill="#fff" opacity="0.4" />
        <Rect x="23" y="108" width="16" height="2" rx="1" fill="#fff" opacity="0.35" />
      </G>
      <G transform="rotate(10, 188, 88)">
        <Rect x="174" y="75" width="24" height="32" rx="3" fill={accent2} opacity="0.85" />
        <Rect x="178" y="82" width="16" height="2" rx="1" fill="#fff" opacity="0.6" />
        <Rect x="178" y="88" width="12" height="2" rx="1" fill="#fff" opacity="0.4" />
      </G>
      <Polygon points="110,28 112,20 114,28 122,28 116,33 118,41 110,36 102,41 104,33 98,28" fill="#F59E0B" opacity="0.9" />
      <Circle cx="45" cy="44" r="4" fill="#60A5FA" opacity="0.6" />
      <Circle cx="176" cy="38" r="3" fill="#A78BFA" opacity="0.6" />
      <Circle cx="166" cy="54" r="2" fill="#34D399" opacity="0.5" />
    </Svg>
  );
}

function IllustrationRewards({ dark }) {
  const gold = '#F59E0B';
  const gold2 = '#FBBF24';
  const blue = '#3B82F6';
  return (
    <Svg width="220" height="190" viewBox="0 0 220 190">
      <Path d="M85 138 Q85 124 95 118 L95 94 Q85 92 80 72 Q78 56 95 56 L125 56 Q142 56 140 72 Q135 92 125 94 L125 118 Q135 124 135 138 Z" fill={dark ? '#D97706' : gold} opacity="0.9" />
      <Path d="M95 66 Q78 66 80 80 Q82 94 95 92" fill="none" stroke={gold2} strokeWidth="5" strokeLinecap="round" />
      <Path d="M125 66 Q142 66 140 80 Q138 94 125 92" fill="none" stroke={gold2} strokeWidth="5" strokeLinecap="round" />
      <Rect x="94" y="138" width="32" height="9" rx="3" fill={dark ? '#92400E' : '#D97706'} />
      <Rect x="86" y="147" width="48" height="7" rx="3" fill={dark ? '#78350F' : '#B45309'} />
      <Polygon points="110,76 112,70 114,76 120,76 116,80 118,86 110,82 102,86 104,80 100,76" fill="#FFF" opacity="0.95" />
      <Path d="M50 152 Q42 136 53 122 Q50 134 61 127 Q53 139 64 131 Q58 148 68 140 Q61 154 50 152 Z" fill="#EF4444" opacity="0.9" />
      <Path d="M56 152 Q52 139 60 128 Q59 138 67 133 Q61 144 69 137 Q65 150 56 152 Z" fill={gold} opacity="0.9" />
      <Path d="M162 152 Q154 136 165 122 Q162 134 173 127 Q165 139 176 131 Q170 148 180 140 Q173 154 162 152 Z" fill="#EF4444" opacity="0.9" />
      <Path d="M168 152 Q164 139 172 128 Q171 138 179 133 Q173 144 181 137 Q177 150 168 152 Z" fill={gold} opacity="0.9" />
      <Circle cx="166" cy="58" r="22" fill={blue} opacity="0.9" />
      <Circle cx="54" cy="64" r="19" fill="#EF4444" opacity="0.85" />
      <Polygon points="110,22 112,14 114,22 122,22 116,27 118,35 110,30 102,35 104,27 98,22" fill={gold} opacity="0.95" />
      <Circle cx="38" cy="44" r="3" fill="#10B981" opacity="0.6" />
      <Circle cx="182" cy="36" r="4" fill="#A78BFA" opacity="0.6" />
    </Svg>
  );
}

function IllustrationSecure({ dark }) {
  const blue = '#3B82F6';
  const blue2 = '#60A5FA';
  const green = '#10B981';
  return (
    <Svg width="220" height="190" viewBox="0 0 220 190">
      <Defs>
        <LinearGradient id="shG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={blue} stopOpacity="0.95" />
          <Stop offset="1" stopColor="#1D4ED8" stopOpacity="0.9" />
        </LinearGradient>
      </Defs>
      <Path d="M110 32 L152 50 L152 95 Q152 128 110 148 Q68 128 68 95 L68 50 Z" fill="url(#shG)" />
      <Path d="M110 46 L142 60 L142 95 Q142 118 110 132 Q78 118 78 95 L78 60 Z" fill={dark ? '#1E3A8A' : '#DBEAFE'} opacity="0.28" />
      <Path d="M102 88 Q110 80 118 88" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <Path d="M98 95 Q110 84 122 95" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <Path d="M95 102 Q110 88 125 102" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <Path d="M98 109 Q110 97 122 109" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <Circle cx="110" cy="88" r="3.5" fill="#fff" />
      <Circle cx="136" cy="124" r="15" fill={green} />
      <Polyline points="130,124 134,128 143,118" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="110" cy="90" r="62" fill="none" stroke={blue2} strokeWidth="1" strokeDasharray="6 5" opacity="0.3" />
      <Circle cx="110" cy="90" r="82" fill="none" stroke={blue2} strokeWidth="1" strokeDasharray="4 7" opacity="0.18" />
      <Circle cx="50" cy="68" r="6" fill={blue2} opacity="0.7" />
      <Circle cx="172" cy="52" r="5" fill="#A78BFA" opacity="0.7" />
      <Circle cx="177" cy="126" r="5" fill={green} opacity="0.6" />
      <Circle cx="40" cy="118" r="4" fill="#F59E0B" opacity="0.6" />
      <Polygon points="50,28 52,20 54,28 62,28 56,33 58,41 50,36 42,41 44,33 38,28" fill="#F59E0B" opacity="0.8" />
    </Svg>
  );
}

function IllustrationCareer({ dark }) {
  const blue = '#3B82F6';
  const blue2 = '#60A5FA';
  const purple = '#8B5CF6';
  const gold = '#F59E0B';
  return (
    <Svg width="220" height="190" viewBox="0 0 220 190">
      <Rect x="80" y="36" width="60" height="52" rx="15" fill={dark ? '#1E3A8A' : blue} />
      <Line x1="110" y1="36" x2="110" y2="20" stroke={blue2} strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="110" cy="18" r="6" fill={blue2} />
      <Circle cx="110" cy="18" r="3" fill="#fff" />
      <Circle cx="97" cy="58" r="10" fill={dark ? '#0F172A' : '#DBEAFE'} />
      <Circle cx="123" cy="58" r="10" fill={dark ? '#0F172A' : '#DBEAFE'} />
      <Circle cx="97" cy="58" r="5.5" fill={blue2} />
      <Circle cx="123" cy="58" r="5.5" fill={blue2} />
      <Circle cx="99" cy="56" r="2" fill="#fff" />
      <Circle cx="125" cy="56" r="2" fill="#fff" />
      <Path d="M100 76 Q110 85 120 76" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <Rect x="75" y="92" width="70" height="50" rx="11" fill={dark ? '#1E3A8A' : blue} opacity="0.85" />
      <Rect x="94" y="102" width="32" height="20" rx="6" fill={dark ? '#0F172A' : '#DBEAFE'} opacity="0.45" />
      <Rect x="82" y="106" width="8" height="8" rx="2" fill={blue2} opacity="0.8" />
      <Rect x="130" y="106" width="8" height="8" rx="2" fill={blue2} opacity="0.8" />
      <Rect x="55" y="94" width="18" height="38" rx="9" fill={dark ? '#1E3A8A' : blue} opacity="0.8" />
      <Rect x="147" y="94" width="18" height="38" rx="9" fill={dark ? '#1E3A8A' : blue} opacity="0.8" />
      <Rect x="85" y="140" width="18" height="26" rx="8" fill={dark ? '#1E3A8A' : blue} opacity="0.8" />
      <Rect x="117" y="140" width="18" height="26" rx="8" fill={dark ? '#1E3A8A' : blue} opacity="0.8" />
      <Rect x="158" y="36" width="38" height="30" rx="6" fill={dark ? '#7C3AED' : purple} opacity="0.9" />
      <Rect x="168" y="30" width="18" height="9" rx="3" fill={dark ? '#5B21B6' : '#7C3AED'} opacity="0.9" />
      <Line x1="158" y1="51" x2="196" y2="51" stroke="#fff" strokeWidth="1.5" opacity="0.45" />
      <Rect x="173" y="47" width="10" height="9" rx="2" fill="#fff" opacity="0.7" />
      <Rect x="22" y="36" width="46" height="26" rx="9" fill={dark ? '#334155' : '#E0F2FE'} />
      <Path d="M38 62 L34 72 L45 62" fill={dark ? '#334155' : '#E0F2FE'} />
      <Rect x="30" y="44" width="30" height="3" rx="1.5" fill={dark ? '#94A3B8' : blue} opacity="0.7" />
      <Rect x="30" y="51" width="22" height="3" rx="1.5" fill={dark ? '#94A3B8' : blue} opacity="0.5" />
      <Polygon points="44,22 46,14 48,22 56,22 50,27 52,35 44,30 36,35 38,27 32,22" fill={gold} opacity="0.9" />
      <Circle cx="168" cy="78" r="4" fill={gold} opacity="0.7" />
      <Circle cx="36" cy="118" r="3" fill={blue2} opacity="0.5" />
      <Circle cx="186" cy="108" r="3" fill="#34D399" opacity="0.5" />
    </Svg>
  );
}

// â”€â”€â”€ Permission Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PermItem({ icon, label, desc, status, onPress, active, color, themeColors }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress && onPress();
  };
  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[pStyles.item, {
        backgroundColor: active ? (color + '18') : themeColors.bg,
        borderColor: active ? color : themeColors.border,
        transform: [{ scale: scaleAnim }],
      }]}>
        <View style={[pStyles.iconWrap, { backgroundColor: active ? color : themeColors.card }]}>
          <Feather name={icon} size={17} color={active ? '#fff' : themeColors.textMuted} />
        </View>
        <View style={pStyles.info}>
          <Text style={[pStyles.label, { color: themeColors.text }]}>{label}</Text>
          <Text style={[pStyles.desc, { color: themeColors.textMuted }]} numberOfLines={1}>{desc}</Text>
        </View>
        <View style={[pStyles.badge, { backgroundColor: active ? color + '22' : themeColors.card }]}>
          <Text style={[pStyles.badgeTxt, { color: active ? color : themeColors.textMuted }]}>{status}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const pStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 10, marginBottom: 8 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  info: { flex: 1 },
  label: { fontSize: 12.5, fontWeight: '700' },
  desc: { fontSize: 10.5, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeTxt: { fontSize: 10, fontWeight: '800' },
});

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function WelcomeOnboardingScreen({ navigation }) {
  const { biometricEnabled, setBiometricPreference } = useAuth();
  const { theme, toggleTheme, colors: themeColors } = useTheme();

  const cameraPerm = Platform.OS !== 'web'
    ? useCameraPermission()
    : { hasPermission: true, requestPermission: () => Promise.resolve(true) };
  const hasCameraPermission = Platform.OS === 'web' ? true : cameraPerm.hasPermission;
  const requestCameraPermission = Platform.OS === 'web' ? () => {} : cameraPerm.requestPermission;

  const [activeSlide, setActiveSlide] = useState(0);
  const [bioCapable, setBioCapable] = useState({ available: false, enrolled: false, label: 'Biometrics' });
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [langCode, setLangCode] = useState('en');
  const [notifGranted, setNotifGranted] = useState(false);
  const [audioGranted, setAudioGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const arrowNudge = useRef(new Animated.Value(0)).current;
  const slideTextOpacity = useRef(new Animated.Value(1)).current;
  const slideTextY = useRef(new Animated.Value(0)).current;

  const t = TRANSLATIONS[langCode] || TRANSLATIONS.en;

  useEffect(() => {
    (async () => {
      try {
        const completed = await storage.getItem('smaart_onboarding_completed');
        const savedLang = await storage.getItem('smaart_pref_language');
        if (savedLang) setLangCode(savedLang);
        if (completed === 'true') { navigation.replace('Login'); }
        else { setCheckingOnboarding(false); }
      } catch { setCheckingOnboarding(false); }
    })();
  }, [navigation]);

  useEffect(() => {
    if (checkingOnboarding) return;
    getBiometricCapability().then(setBioCapable);
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.3, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(arrowNudge, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(arrowNudge, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(arrowNudge, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, [checkingOnboarding]);

  useEffect(() => {
    slideTextOpacity.setValue(0);
    slideTextY.setValue(20);
    Animated.parallel([
      Animated.timing(slideTextOpacity, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideTextY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [activeSlide]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const x = event.nativeEvent.contentOffset.x;
        const index = Math.round(x / SCREEN_WIDTH);
        if (index !== activeSlide && index >= 0 && index < SLIDE_COUNT) setActiveSlide(index);
      },
    }
  );

  const handleNext = () => {
    if (activeSlide < SLIDE_COUNT - 1) {
      scrollViewRef.current?.scrollTo({ x: (activeSlide + 1) * SCREEN_WIDTH, animated: true });
      setActiveSlide(activeSlide + 1);
    } else { handleCompleteOnboarding(); }
  };

  const handleCompleteOnboarding = async () => {
    await storage.setItem('smaart_onboarding_completed', 'true');
    await storage.setItem('smaart_pref_language', langCode);
    navigation.replace('Login');
  };

  const getSlideMotionStyle = (index) => {
    const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
    return {
      opacity: scrollX.interpolate({ inputRange, outputRange: [0.28, 1, 0.28], extrapolate: 'clamp' }),
      transform: [{ scale: scrollX.interpolate({ inputRange, outputRange: [0.88, 1, 0.88], extrapolate: 'clamp' }) }],
    };
  };

  const handleNotification = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotifGranted(status === 'granted');
  };
  const handleAudio = async () => {
    const { status } = await requestRecordingPermissionsAsync();
    setAudioGranted(status === 'granted');
  };
  const handleLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationGranted(status === 'granted');
  };
  const handleCamera = async () => { if (!hasCameraPermission) await requestCameraPermission(); };
  const handleToggleBiometrics = async () => {
    if (!biometricEnabled) {
      const res = await promptBiometric('Enable biometric access for SMAART');
      if (res.success) await setBiometricPreference(true);
    } else { await setBiometricPreference(false); }
  };

  const logoSource = theme === 'dark'
    ? require('../../../assets/smaart-logo.png')
    : require('../../../assets/new_smaart_logo_light.png');
  const markSource = theme === 'dark'
    ? require('../../../assets/smaart-mark.png')
    : require('../../../assets/smaart-mark-navy.png');

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  const renderSlideText = (idx) => (
    <Animated.View style={[styles.textContainer, {
      opacity: activeSlide === idx ? slideTextOpacity : 1,
      transform: [{ translateY: activeSlide === idx ? slideTextY : 0 }],
    }]}>
      <View style={[styles.tagPill, { backgroundColor: TAG_COLORS[idx] + '1F' }]}>
        <Text style={[styles.tagPillText, { color: TAG_COLORS[idx] }]}>{t.slides[idx].tag}</Text>
      </View>
      <Text style={[styles.slideTitle, { color: themeColors.text }]}>{t.slides[idx].title}</Text>
      <Text style={[styles.slideDesc, { color: themeColors.textMuted }]}>{t.slides[idx].desc}</Text>
    </Animated.View>
  );

  if (checkingOnboarding) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: themeColors.bg }]}>
        <RNStatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />
        <Image source={logoSource} style={styles.loadingLogo} resizeMode="contain" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <RNStatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

      <Animated.View style={[styles.blob, styles.blob1, {
        opacity: pulseAnim,
        backgroundColor: TAG_COLORS[activeSlide] + '0E',
      }]} />
      <Animated.View style={[styles.blob, styles.blob2, { opacity: pulseAnim }]} />

      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.brandHeader}>
          <View style={styles.brandRow}>
            <Image source={markSource} style={styles.brandMark} resizeMode="contain" />
            <View>
              <Text style={[styles.brandName, { color: themeColors.text }]}>SMAART</Text>
              <Text style={[styles.brandNameSub, { color: themeColors.textMuted }]}>INSTITUTE</Text>
            </View>
          </View>
          <Text style={[styles.brandSubtitle, { color: themeColors.primaryBright || '#3B82F6' }]}>STUDENT PORTAL</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.prefBtn, pressed && styles.prefBtnPressed,
            { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          onPress={() => setModalVisible(true)} hitSlop={12}
        >
          <Feather name="settings" size={18} color={themeColors.text} />
          <Text style={[styles.prefBtnText, { color: themeColors.text }]}>Prefs</Text>
        </Pressable>
      </View>

      {/* Carousel */}
      <ScrollView
        ref={scrollViewRef} horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll} scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {/* Slide 0: Learn */}
        <View style={styles.slide}>
          <Animated.View style={[styles.slideInner, getSlideMotionStyle(0)]}>
            <Animated.View style={[styles.visual, { transform: [{ translateY: floatY }] }]}>
              <IllustrationLearn dark={theme === 'dark'} />
            </Animated.View>
            {renderSlideText(0)}
          </Animated.View>
        </View>

        {/* Slide 1: Rewards */}
        <View style={styles.slide}>
          <Animated.View style={[styles.slideInner, getSlideMotionStyle(1)]}>
            <Animated.View style={[styles.visual, { transform: [{ translateY: floatY }] }]}>
              <IllustrationRewards dark={theme === 'dark'} />
            </Animated.View>
            {renderSlideText(1)}
          </Animated.View>
        </View>

        {/* Slide 2: Secure */}
        <View style={styles.slide}>
          <Animated.View style={[styles.slideInner, getSlideMotionStyle(2)]}>
            <Animated.View style={[styles.visual, { transform: [{ translateY: floatY }] }]}>
              <IllustrationSecure dark={theme === 'dark'} />
            </Animated.View>
            {renderSlideText(2)}
          </Animated.View>
        </View>

        {/* Slide 3: Career Agent */}
        <View style={styles.slide}>
          <Animated.View style={[styles.slideInner, getSlideMotionStyle(3)]}>
            <Animated.View style={[styles.visual, { transform: [{ translateY: floatY }] }]}>
              <IllustrationCareer dark={theme === 'dark'} />
            </Animated.View>
            {renderSlideText(3)}
          </Animated.View>
        </View>

        {/* Slide 4: Permissions */}
        <View style={styles.slide}>
          <Animated.View style={[styles.slideInner, getSlideMotionStyle(4)]}>
            <Animated.View style={[styles.textContainer, {
              opacity: activeSlide === 4 ? slideTextOpacity : 1,
              transform: [{ translateY: activeSlide === 4 ? slideTextY : 0 }],
              marginBottom: 10,
            }]}>
              <View style={[styles.tagPill, { backgroundColor: TAG_COLORS[4] + '1F' }]}>
                <Text style={[styles.tagPillText, { color: TAG_COLORS[4] }]}>{t.slides[4].tag}</Text>
              </View>
              <Text style={[styles.slideTitle, { color: themeColors.text }]}>{t.slides[4].title}</Text>
              <Text style={[styles.slideDesc, { color: themeColors.textMuted }]}>{t.slides[4].desc}</Text>
            </Animated.View>

            <View style={[styles.permsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <PermItem icon="bell" label="Push Notifications" desc="Exam reminders, class alerts & campus notices"
                status={notifGranted ? 'Granted' : 'Grant'} active={notifGranted}
                color="#3B82F6" onPress={handleNotification} themeColors={themeColors} />
              <PermItem icon="mic" label="Microphone & Sound" desc="Audio monitoring during assessments"
                status={audioGranted ? 'Granted' : 'Grant'} active={audioGranted}
                color="#8B5CF6" onPress={handleAudio} themeColors={themeColors} />
              <PermItem icon="camera" label="Camera Access" desc="On-device face verification for proctoring"
                status={hasCameraPermission ? 'Granted' : 'Grant'} active={hasCameraPermission}
                color="#EC4899" onPress={handleCamera} themeColors={themeColors} />
              <PermItem icon="map-pin" label="Location" desc="Campus detection & location-aware features"
                status={locationGranted ? 'Granted' : 'Grant'} active={locationGranted}
                color="#10B981" onPress={handleLocation} themeColors={themeColors} />
              {bioCapable.available && (
                <PermItem icon="shield" label={bioCapable.label + ' Unlock'} desc="Optional â€” instant secure access"
                  status={biometricEnabled ? 'Enabled' : 'Enable'} active={biometricEnabled}
                  color="#F59E0B" onPress={handleToggleBiometrics} themeColors={themeColors} />
              )}
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.pagingDotsWrap}>
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            return (
              <Animated.View key={i} style={[styles.dot, {
                width: scrollX.interpolate({ inputRange, outputRange: [6, 26, 6], extrapolate: 'clamp' }),
                opacity: scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' }),
                backgroundColor: activeSlide === i ? TAG_COLORS[i] : themeColors.border,
              }]} />
            );
          })}
        </View>

        <PressScale
          style={[styles.ctaBtn, { backgroundColor: TAG_COLORS[activeSlide] }]}
          pressedStyle={styles.ctaBtnPressed}
          scaleTo={0.97}
          onPress={handleNext}
        >
          <Text style={styles.ctaBtnText}>{activeSlide === SLIDE_COUNT - 1 ? t.finish : t.next}</Text>
          <Animated.View style={{ transform: [{ translateX: arrowNudge.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) }] }}>
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          </Animated.View>
        </PressScale>

        <Pressable onPress={handleCompleteOnboarding} style={styles.skipBtn}>
          <Text style={[styles.skipBtnText, { color: themeColors.textMuted }]}>{t.skip}</Text>
        </Pressable>
      </View>

      {/* Preferences Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t.prefTitle}</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8} style={styles.closeBtn}>
                <Feather name="x" size={20} color={themeColors.text} />
              </Pressable>
            </View>
            <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>{t.languageLabel}</Text>
            <View style={styles.languageGrid}>
              {LANGUAGES.map((lang) => {
                const isActive = langCode === lang.code;
                return (
                  <Pressable key={lang.code}
                    style={[styles.langBtn, { borderColor: themeColors.border },
                      isActive && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]}
                    onPress={() => setLangCode(lang.code)}
                  >
                    <Text style={[styles.langBtnText, { color: isActive ? '#fff' : themeColors.text }]}>{lang.label}</Text>
                    {isActive && <Feather name="check" size={12} color="#fff" style={{ marginLeft: 4 }} />}
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.preferenceLabelText, { color: themeColors.text }]}>{t.themeLabel}</Text>
                <Text style={[styles.preferenceDescText, { color: themeColors.textMuted }]}>
                  {theme === 'dark' ? t.darkMode : t.lightMode}
                </Text>
              </View>
              <Switch value={theme === 'dark'} onValueChange={toggleTheme}
                trackColor={{ false: '#94A3B8', true: '#3B82F6' }}
                thumbColor={Platform.OS === 'ios' ? undefined : (theme === 'dark' ? '#2563EB' : '#F1F5F9')} />
            </View>
            <Pressable style={({ pressed }) => [styles.applyBtn, pressed && styles.applyBtnPressed, { backgroundColor: themeColors.primary }]}
              onPress={async () => { await storage.setItem('smaart_pref_language', langCode); setModalVisible(false); }}
            >
              <Text style={styles.applyBtnText}>{t.apply}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingLogo: { width: 220, height: 75 },
  blob: { position: 'absolute', borderRadius: 999 },
  blob1: { width: 320, height: 320, top: -90, left: -70 },
  blob2: { width: 260, height: 260, bottom: 90, right: -60, backgroundColor: 'rgba(16,185,129,0.04)' },
  headerBar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
  brandHeader: { alignItems: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 34, height: 34, marginRight: 10 },
  brandName: { fontSize: 19, fontWeight: '800', letterSpacing: 0.2, lineHeight: 21 },
  brandNameSub: { fontSize: 10.5, fontWeight: '700', letterSpacing: 2.4, lineHeight: 13 },
  brandSubtitle: { fontSize: 9.5, fontWeight: '900', letterSpacing: 2, marginTop: 6, marginLeft: 44 },
  prefBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.2 },
  prefBtnPressed: { opacity: 0.8 },
  prefBtnText: { fontSize: 12, fontWeight: '700', marginLeft: 5 },
  scrollView: { flex: 1 },
  slide: { width: SCREEN_WIDTH, flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  slideInner: { flex: 1, justifyContent: 'center' },
  visual: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  textContainer: { alignItems: 'center', marginTop: 6 },
  tagPill: { paddingHorizontal: 13, paddingVertical: 4, borderRadius: 999, marginBottom: 10 },
  tagPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  slideTitle: { fontSize: 26, fontWeight: '800', textAlign: 'center', lineHeight: 33 },
  slideDesc: { fontSize: 13.5, fontWeight: '500', textAlign: 'center', lineHeight: 21, marginTop: 10, paddingHorizontal: 6 },
  permsCard: { borderRadius: 20, borderWidth: 1, padding: 14 },
  footer: { paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center' },
  pagingDotsWrap: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  dot: { height: 6, borderRadius: 3, marginHorizontal: 3 },
  ctaBtn: { width: '100%', height: 54, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...shadow.button },
  ctaBtnPressed: { opacity: 0.9 },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginRight: 8 },
  skipBtn: { paddingVertical: 10, marginTop: 6 },
  skipBtnText: { fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  languageGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  langBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.2, marginRight: 8, marginBottom: 8 },
  langBtnText: { fontSize: 13, fontWeight: '700' },
  dividerLine: { height: 1.2, width: '100%', marginVertical: 16 },
  preferenceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preferenceLabelText: { fontSize: 14, fontWeight: '800' },
  preferenceDescText: { fontSize: 11, marginTop: 2 },
  applyBtn: { width: '100%', height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 24, ...shadow.button },
  applyBtnPressed: { opacity: 0.9 },
  applyBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});