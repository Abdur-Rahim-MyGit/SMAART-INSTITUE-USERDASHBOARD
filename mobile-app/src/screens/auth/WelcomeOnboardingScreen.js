/**
 * WelcomeOnboardingScreen — Premium, polished onboarding experience.
 *
 * Design updates:
 *   - Ultra-crisp SMAART Institute Brand Header with luxury typography & glassmorphic language chip
 *   - Flawless 3D Avatar Cluster with cleaned background badges & soft ambient aura
 *   - Award-winning CTA Button Design: Rich sapphire pill, inner glow, circular icon badge, subtle animated bounce
 *   - Refined vertical rhythm, typography hierarchy, and smooth pagination
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
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadow } from '../../theme';
import * as storage from '../../utils/storage';
import { getBiometricCapability, promptBiometric } from '../../utils/biometrics';
import { PressScale } from '../../components/Motion';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDE_COUNT = 5;

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ur', label: 'اردو' },
];

const TRANSLATIONS = {
  en: {
    next: 'Next Slide',
    finish: 'Get Started',
    skip: 'Skip Introduction',
    prefTitle: 'App Preferences',
    languageLabel: 'Select Language',
    themeLabel: 'Theme Mode',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    apply: 'Apply Preferences',
    granted: 'Granted',
    grant: 'Grant',
    optional: 'Optional',
    enabled: 'Enabled',
    enable: 'Enable',
    active: 'Active',
    notifyLabel: 'Push Alerts',
    slides: [
      {
        tag: 'WELCOME',
        title: 'Welcome to SMAART Institute',
        desc: 'AI-Powered Learning & Career Platform. Empowering students with smart campus tools for coursework, schedules, and proctored examinations.',
      },
      {
        tag: 'LEARN',
        title: 'Learn Anytime, Anywhere',
        desc: 'Access your coursework, assessments, and AI study mentors at your own pace. Stay placement-ready with smart interactive tools.',
      },
      {
        tag: 'SECURE',
        title: 'Secure Proctored Exams',
        desc: 'Take official university assessments with on-device face verification and instant biometric unlock. Privacy-first, verified, and seamless.',
      },
      {
        tag: 'CAREER',
        title: 'Meet Your Career Agent',
        desc: 'Your 24/7 AI mentor scouts dream jobs, crafts ATS resumes, tracks placement milestones, and propels your professional future.',
      },
      {
        tag: 'SETUP',
        title: 'Set Up Your Experience',
        desc: 'Grant the permissions that power SMAART smart features. You can update these anytime in Settings.',
      },
    ],
  },
  hi: {
    next: 'अगली स्लाइड',
    finish: 'शुरू करें',
    skip: 'छोड़ें',
    prefTitle: 'ऐप प्राथमिकताएं',
    languageLabel: 'भाषा चुनें',
    themeLabel: 'थीम मोड',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    apply: 'लागू करें',
    granted: 'स्वीकृत',
    grant: 'अनुमति दें',
    optional: 'वैकल्पिक',
    enabled: 'सक्षम',
    enable: 'सक्षम करें',
    active: 'सक्रिय',
    notifyLabel: 'पुश नोटिफिकेशन',
    slides: [
      {
        tag: 'WELCOME',
        title: 'SMAART इंस्टीट्यूट में आपका स्वागत है',
        desc: 'AI-संचालित शिक्षण और करियर प्लेटफ़ॉर्म। कोर्सवर्क, समय-सारिणी और प्रोक्टर्ड परीक्षाओं के लिए स्मार्ट कैंपस टूल्स।',
      },
      {
        tag: 'LEARN',
        title: 'कभी भी, कहीं भी सीखें',
        desc: 'अपनी गति से कोर्स और मूल्यांकन एक्सेस करें। प्लेसमेंट के लिए स्मार्ट टूल्स के साथ तैयार हों।',
      },
      {
        tag: 'SECURE',
        title: 'सुरक्षित एवं सहज अनुभव',
        desc: 'AI प्रोक्टरिंग और बायोमेट्रिक अनलॉक। गोपनीयता-प्रथम, सुरक्षित और निर्बाध परीक्षा।',
      },
      {
        tag: 'CAREER',
        title: 'आपका करियर एजेंट',
        desc: 'AI मेंटर नौकरियां खोजता है, बायोडाटा बनाता है और आपकी तैयारी 24/7 ट्रैक करता है।',
      },
      {
        tag: 'SETUP',
        title: 'अनुभव सेट करें',
        desc: 'SMAART सुविधाओं के लिए अनुमतियां दें। आप इन्हें कभी भी सेटिंग्स में बदल सकते हैं।',
      },
    ],
  },
  ta: {
    next: 'அடுத்தது',
    finish: 'தொடங்கவும்',
    skip: 'தவிர்க்கவும்',
    prefTitle: 'விருப்பத்தேர்வுகள்',
    languageLabel: 'மொழி',
    themeLabel: 'தீம்',
    lightMode: 'லைட்',
    darkMode: 'டார்க்',
    apply: 'பயன்படுத்துக',
    granted: 'அனுமதிக்கப்பட்டது',
    grant: 'அனுமதி',
    optional: 'விருப்பம்',
    enabled: 'செயல்பட்டது',
    enable: 'செயல்படுத்து',
    active: 'செயலில்',
    notifyLabel: 'அறிவிப்புகள்',
    slides: [
      {
        tag: 'WELCOME',
        title: 'SMAART நிறுவனத்திற்கு வருக',
        desc: 'AI-இயங்கும் கற்றல் மற்றும் தொழில் தளம். ஸ்மார்ட் வளாக கருவிகள் மூலம் மாணவர்களை மேம்படுத்துகிறது.',
      },
      {
        tag: 'LEARN',
        title: 'எங்கும் கற்றுக்கொள்ளுங்கள்',
        desc: 'உங்கள் வேகத்தில் கற்று வேலை வாய்ப்பிற்கு தயாராகுங்கள்.',
      },
      {
        tag: 'SECURE',
        title: 'பாதுகாப்பான அனுபவம்',
        desc: 'AI புரோக்டரிங் மற்றும் பயோமெட்ரிக் அணுகல்.',
      },
      {
        tag: 'CAREER',
        title: 'கரியர் ஏஜென்ட்',
        desc: 'AI வழிகாட்டி வேலை தேடும், 24/7 கண்காணிக்கும்.',
      },
      {
        tag: 'SETUP',
        title: 'அனுமதிகளை வழங்கவும்',
        desc: 'SMAART அம்சங்களை செயல்படுத்த அனுமதிகளை வழங்கவும்.',
      },
    ],
  },
  te: {
    next: 'తదుపరి',
    finish: 'ప్రారంభించండి',
    skip: 'దాటవేయి',
    prefTitle: 'ప్రాధాన్యతలు',
    languageLabel: 'భాష',
    themeLabel: 'థీమ్',
    lightMode: 'లైట్',
    darkMode: 'డార్క్',
    apply: 'వర్తింపజేయి',
    granted: 'అనుమతించబడింది',
    grant: 'అనుమతి',
    optional: 'ఐచ్ఛికం',
    enabled: 'ప్రారంభించబడింది',
    enable: 'ప్రారంభించు',
    active: 'సక్రియంగా',
    notifyLabel: 'నోటిఫికేషన్లు',
    slides: [
      {
        tag: 'WELCOME',
        title: 'SMAART ఇన్స్టిట్యూట్‌కు స్వాగతం',
        desc: 'AI-ఆధారిత లెర్నింగ్ & కెరీర్ ప్లాట్‌ఫారమ్. స్మార్ట్ క్యాంపస్ సాధనాలతో విద్యార్థులకు సాధికారత.',
      },
      {
        tag: 'LEARN',
        title: 'ఎప్పుడైనా నేర్చుకోండి',
        desc: 'మీ వేగంలో కోర్సులు యాక్సెస్ చేసి ప్లేస్‌మెంట్‌కు సిద్ధంగా ఉండండి.',
      },
      {
        tag: 'SECURE',
        title: 'సురక్షిత అనుభవం',
        desc: 'AI ప్రాక్టరింగ్ మరియు బయోమెట్రిక్ అనుభవం.',
      },
      {
        tag: 'CAREER',
        title: 'కెరీర్ ఏజెంట్',
        desc: 'AI మెంటర్ ఉద్యోగాలు వెతుకుతుంది, 24/7 ట్రాక్ చేస్తుంది.',
      },
      {
        tag: 'SETUP',
        title: 'అనుభవాన్ని సెటప్ చేయండి',
        desc: 'SMAART స్మార్ట్ ఫీచర్లకు అనుమతులు మంజూరు చేయండి.',
      },
    ],
  },
  ur: {
    next: 'اگلی سلائیڈ',
    finish: 'شروع کریں',
    skip: 'چھوڑیں',
    prefTitle: 'ترجیحات',
    languageLabel: 'زبان',
    themeLabel: 'تھیم',
    lightMode: 'لائٹ',
    darkMode: 'ڈارک',
    apply: 'لاگو کریں',
    granted: 'منظور',
    grant: 'اجازت',
    optional: 'اختیاری',
    enabled: 'فعال',
    enable: 'فعال کریں',
    active: 'سرگرم',
    notifyLabel: 'اطلاعات',
    slides: [
      {
        tag: 'WELCOME',
        title: 'SMAART انسٹی ٹیوٹ میں خوش آمدید',
        desc: 'AI سے چلنے والا تعلیمی اور کیریئر پلیٹ فارم۔ اسمارٹ کیمپس ٹولز برائے کورس ورک اور امتحانات۔',
      },
      {
        tag: 'LEARN',
        title: 'کہیں بھی سیکھیں',
        desc: 'اپنی رفتار سے کورسز ایکسیس کریں۔ پلیسمنٹ کے لیے تیار ہوں۔',
      },
      {
        tag: 'SECURE',
        title: 'محفوظ تجربہ',
        desc: 'AI پروکٹرنگ اور بائیو میٹرک — رازداری پہلے۔',
      },
      {
        tag: 'CAREER',
        title: 'کیریئر ایجنٹ',
        desc: 'AI رہنما نوکریاں ڈھونڈتا اور 24/7 نگرانی کرتا ہے۔',
      },
      {
        tag: 'SETUP',
        title: 'تجربہ ترتیب دیں',
        desc: 'SMAART خصوصیات کے لیے اجازتیں دیں۔',
      },
    ],
  },
};

// ─── Pure React Native SMAART Logo Mark (Zero Native SVG Dependencies) ─────
function SmaartLogoMark({ size = 32 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: '#0F2642',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#02569B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: size * 0.44,
          height: size * 0.44,
          backgroundColor: '#FFFFFF',
          transform: [{ rotate: '45deg' }],
          borderRadius: 2,
        }}
      />
    </View>
  );
}

// ─── 3D Avatar Cluster for Slide 0 ──────────────────────────────────────────
function AvatarCluster({ floatAnim, floatAnim2 }) {
  const floatY1 = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const floatY2 = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 7] });

  return (
    <View style={avatarStyles.container}>
      {/* Top Row: Boy 1 & Boy 2 */}
      <View style={avatarStyles.topRow}>
        {/* Left: Boy 1 with soft pink glow ring */}
        <Animated.View style={[avatarStyles.avatarWrap, { transform: [{ translateY: floatY1 }] }]}>
          <View style={[avatarStyles.haloOuter, avatarStyles.haloPink]}>
            <Image
              source={require('../../../assets/avatar_boy1.png')}
              style={avatarStyles.avatarImg}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Right: Boy 2 with soft sky-blue glow ring */}
        <Animated.View style={[avatarStyles.avatarWrap, { transform: [{ translateY: floatY2 }] }]}>
          <View style={[avatarStyles.haloOuter, avatarStyles.haloBlue]}>
            <Image
              source={require('../../../assets/avatar_boy2.png')}
              style={avatarStyles.avatarImg}
              resizeMode="cover"
            />
          </View>
        </Animated.View>
      </View>

      {/* Bottom Center: Girl with clean mint background (no checkered artifacts) */}
      <Animated.View style={[avatarStyles.bottomWrap, { transform: [{ translateY: floatY1 }] }]}>
        <View style={[avatarStyles.haloOuter, avatarStyles.haloMint]}>
          <Image
            source={require('../../../assets/avatar_girl_clean.png')}
            style={avatarStyles.avatarImgLarge}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  container: {
    width: 280,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 225,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  haloOuter: {
    padding: 3.5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  haloPink: {
    borderWidth: 2.5,
    borderColor: '#FED7E2',
    shadowColor: '#ED64A6',
  },
  haloBlue: {
    borderWidth: 2.5,
    borderColor: '#BAE6FD',
    shadowColor: '#0284C7',
  },
  haloMint: {
    borderWidth: 2.5,
    borderColor: '#A7F3D0',
    shadowColor: '#10B981',
  },
  avatarImg: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  avatarImgLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
});

// ─── Single 3D Badge Visual for Slides 1, 2, 3 ──────────────────────────────
function SlideBadgeVisual({ imageSource, floatAnim, badgeColor = '#02569B' }) {
  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <Animated.View style={[badgeStyles.container, { transform: [{ translateY: floatY }] }]}>
      <View style={[badgeStyles.outerRing, { borderColor: badgeColor + '25', shadowColor: badgeColor }]}>
        <View style={badgeStyles.innerCard}>
          <Image source={imageSource} style={badgeStyles.badgeImage} resizeMode="cover" />
        </View>
      </View>
    </Animated.View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    height: 220,
  },
  outerRing: {
    padding: 5,
    borderRadius: 110,
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  innerCard: {
    width: 185,
    height: 185,
    borderRadius: 95,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
});

// ─── Permission Item Component ──────────────────────────────────────────────
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
      <Animated.View
        style={[
          pStyles.item,
          {
            backgroundColor: active ? color + '10' : themeColors.bg,
            borderColor: active ? color : themeColors.border,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[pStyles.iconWrap, { backgroundColor: active ? color : themeColors.card }]}>
          <Feather name={icon} size={15} color={active ? '#fff' : themeColors.textMuted} />
        </View>
        <View style={pStyles.info}>
          <Text style={[pStyles.label, { color: themeColors.text }]}>{label}</Text>
          <Text style={[pStyles.desc, { color: themeColors.textMuted }]} numberOfLines={1}>
            {desc}
          </Text>
        </View>
        <View style={[pStyles.badge, { backgroundColor: active ? color + '22' : themeColors.card }]}>
          <Text style={[pStyles.badgeTxt, { color: active ? color : themeColors.textMuted }]}>
            {status}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const pStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1.2,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 7,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  info: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700' },
  desc: { fontSize: 10, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 16 },
  badgeTxt: { fontSize: 9.5, fontWeight: '800' },
});

// ─── Main Onboarding Screen Component ───────────────────────────────────────
export default function WelcomeOnboardingScreen({ navigation }) {
  const { biometricEnabled, setBiometricPreference } = useAuth();
  const { theme, toggleTheme, colors: themeColors } = useTheme();

  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [bioCapable, setBioCapable] = useState({ available: false, enrolled: false, label: 'Biometrics' });
  const [modalVisible, setModalVisible] = useState(false);
  const [langCode, setLangCode] = useState('en');
  const [notifGranted, setNotifGranted] = useState(false);
  const [audioGranted, setAudioGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const slideTextOpacity = useRef(new Animated.Value(1)).current;
  const slideTextY = useRef(new Animated.Value(0)).current;

  const t = TRANSLATIONS[langCode] || TRANSLATIONS.en;

  useEffect(() => {
    (async () => {
      try {
        const savedLang = await storage.getItem('smaart_pref_language');
        if (savedLang) setLangCode(savedLang);
      } catch {
        // Continue normally
      }
    })();
    getBiometricCapability().then(setBioCapable);

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    floatLoop.start();

    const floatLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 1, duration: 2900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 0, duration: 2900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    floatLoop2.start();

    return () => {
      floatLoop.stop();
      floatLoop2.stop();
    };
  }, [floatAnim, floatAnim2]);

  useEffect(() => {
    slideTextOpacity.setValue(0);
    slideTextY.setValue(10);
    Animated.parallel([
      Animated.timing(slideTextOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideTextY, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [activeSlide]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const x = event.nativeEvent.contentOffset.x;
        const index = Math.round(x / SCREEN_WIDTH);
        if (index !== activeSlide && index >= 0 && index < SLIDE_COUNT) {
          setActiveSlide(index);
        }
      },
    }
  );

  const handleNext = () => {
    if (activeSlide < SLIDE_COUNT - 1) {
      scrollViewRef.current?.scrollTo({ x: (activeSlide + 1) * SCREEN_WIDTH, animated: true });
      setActiveSlide(activeSlide + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleCompleteOnboarding = async () => {
    await storage.setItem('smaart_pref_language', langCode);
    navigation.replace('Login');
  };

  const getSlideMotionStyle = (index) => {
    const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
    return {
      opacity: scrollX.interpolate({ inputRange, outputRange: [0.35, 1, 0.35], extrapolate: 'clamp' }),
      transform: [{ scale: scrollX.interpolate({ inputRange, outputRange: [0.93, 1, 0.93], extrapolate: 'clamp' }) }],
    };
  };

  const handleNotification = async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const res = await PermissionsAndroid.request(
          'android.permission.POST_NOTIFICATIONS'
        );
        setNotifGranted(res === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setNotifGranted(true);
      }
    } catch {
      setNotifGranted(true);
    }
  };

  const handleAudio = async () => {
    try {
      if (Platform.OS === 'android') {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        setAudioGranted(res === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setAudioGranted(true);
      }
    } catch {
      setAudioGranted(true);
    }
  };

  const handleLocation = async () => {
    try {
      if (Platform.OS === 'android') {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setLocationGranted(res === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setLocationGranted(true);
      }
    } catch {
      setLocationGranted(true);
    }
  };

  const handleCamera = async () => {
    try {
      if (Platform.OS === 'android') {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        setHasCameraPermission(res === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setHasCameraPermission(true);
      }
    } catch {
      setHasCameraPermission(true);
    }
  };

  const handleToggleBiometrics = async () => {
    if (!biometricEnabled) {
      const res = await promptBiometric('Enable biometric access for SMAART');
      if (res.success) await setBiometricPreference(true);
    } else {
      await setBiometricPreference(false);
    }
  };

  const isLight = theme !== 'dark';
  const bgColor = isLight ? '#F0F6FA' : themeColors.bg;

  const renderSlideText = (idx) => (
    <Animated.View
      style={[
        styles.textContainer,
        {
          opacity: activeSlide === idx ? slideTextOpacity : 1,
          transform: [{ translateY: activeSlide === idx ? slideTextY : 0 }],
        },
      ]}
    >
      <Text style={[styles.slideTitle, { color: isLight ? '#0F2642' : themeColors.text }]}>
        {t.slides[idx].title}
      </Text>
      <Text style={[styles.slideDesc, { color: isLight ? '#4B6B8A' : themeColors.textMuted }]}>
        {t.slides[idx].desc}
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <RNStatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />

      {/* Top Brand Header Bar */}
      <View style={styles.topBar}>
        {/* Left: Pure Vector SMAART Institute Logo & Badge */}
        <View style={styles.brandBox}>
          <View style={styles.brandIconWrap}>
            <SmaartLogoMark size={32} />
          </View>
          <View style={styles.brandTextWrap}>
            <View style={styles.brandNameRow}>
              <Text style={[styles.brandNameMain, { color: isLight ? '#0B223D' : '#FFFFFF' }]}>SMAART</Text>
            </View>
            <Text style={[styles.brandNameSub, { color: isLight ? '#02569B' : '#60A5FA' }]}>INSTITUTE</Text>
          </View>
        </View>

        {/* Right: Glassmorphic Language Chip */}
        <Pressable
          style={({ pressed }) => [
            styles.langChip,
            pressed && styles.langChipPressed,
            {
              backgroundColor: isLight ? '#FFFFFF' : themeColors.card,
              borderColor: isLight ? '#D3E4F0' : themeColors.border,
            },
          ]}
          onPress={() => setModalVisible(true)}
          hitSlop={10}
        >
          <View style={styles.langGlobeIcon}>
            <Feather name="globe" size={13} color="#02569B" />
          </View>
          <Text style={[styles.langChipText, { color: isLight ? '#02569B' : themeColors.text }]}>
            {LANGUAGES.find((l) => l.code === langCode)?.label || 'English'}
          </Text>
          <Feather name="chevron-down" size={12} color={isLight ? '#64748B' : themeColors.textMuted} style={{ marginLeft: 2 }} />
        </Pressable>
      </View>

      {/* Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Slide 0: Welcome with Clean 3D Avatar Cluster */}
        <View style={styles.slide}>
          <Animated.View style={[styles.slideInner, getSlideMotionStyle(0)]}>
            <AvatarCluster floatAnim={floatAnim} floatAnim2={floatAnim2} />
            {renderSlideText(0)}
          </Animated.View>
        </View>

        {/* Slide 1: Learn Anytime, Anywhere (3D AI Study) */}
        <View style={styles.slide}>
          <Animated.View style={[styles.slideInner, getSlideMotionStyle(1)]}>
            <SlideBadgeVisual
              imageSource={require('../../../assets/onboarding_study.png')}
              floatAnim={floatAnim}
              badgeColor="#02569B"
            />
            {renderSlideText(1)}
          </Animated.View>
        </View>

        {/* Slide 2: Secure Proctored Exams (3D Verified Exam) */}
        <View style={styles.slide}>
          <Animated.View style={[styles.slideInner, getSlideMotionStyle(2)]}>
            <SlideBadgeVisual
              imageSource={require('../../../assets/onboarding_exam.png')}
              floatAnim={floatAnim2}
              badgeColor="#10B981"
            />
            {renderSlideText(2)}
          </Animated.View>
        </View>

        {/* Slide 3: Career Agent (3D Graduate Rocket) */}
        <View style={styles.slide}>
          <Animated.View style={[styles.slideInner, getSlideMotionStyle(3)]}>
            <SlideBadgeVisual
              imageSource={require('../../../assets/onboarding_career.png')}
              floatAnim={floatAnim}
              badgeColor="#7C3AED"
            />
            {renderSlideText(3)}
          </Animated.View>
        </View>

        {/* Slide 4: Set Up Experience (Permissions) */}
        <View style={styles.slide}>
          <Animated.View style={[styles.slideInner, getSlideMotionStyle(4)]}>
            <View style={styles.permsCardWrap}>
              <Animated.View
                style={[
                  styles.textContainer,
                  {
                    opacity: activeSlide === 4 ? slideTextOpacity : 1,
                    transform: [{ translateY: activeSlide === 4 ? slideTextY : 0 }],
                    marginBottom: 10,
                  },
                ]}
              >
                <Text style={[styles.slideTitleSmall, { color: isLight ? '#0F2642' : themeColors.text }]}>
                  {t.slides[4].title}
                </Text>
                <Text style={[styles.slideDescSmall, { color: isLight ? '#4B6B8A' : themeColors.textMuted }]}>
                  {t.slides[4].desc}
                </Text>
              </Animated.View>

              <View
                style={[
                  styles.permsCard,
                  {
                    backgroundColor: isLight ? '#FFFFFF' : themeColors.card,
                    borderColor: isLight ? '#DBE8F2' : themeColors.border,
                  },
                ]}
              >
                <PermItem
                  icon="bell"
                  label="Push Alerts"
                  desc="Exam reminders & class schedule notices"
                  status={notifGranted ? 'Granted' : 'Grant'}
                  active={notifGranted}
                  color="#02569B"
                  onPress={handleNotification}
                  themeColors={themeColors}
                />
                <PermItem
                  icon="camera"
                  label="Camera Access"
                  desc="On-device face verification for proctoring"
                  status={hasCameraPermission ? 'Granted' : 'Grant'}
                  active={hasCameraPermission}
                  color="#10B981"
                  onPress={handleCamera}
                  themeColors={themeColors}
                />
                <PermItem
                  icon="mic"
                  label="Microphone"
                  desc="Audio assessment & speech verification"
                  status={audioGranted ? 'Granted' : 'Grant'}
                  active={audioGranted}
                  color="#8B5CF6"
                  onPress={handleAudio}
                  themeColors={themeColors}
                />
                <PermItem
                  icon="map-pin"
                  label="Location"
                  desc="Campus detection & smart attendance"
                  status={locationGranted ? 'Granted' : 'Grant'}
                  active={locationGranted}
                  color="#F59E0B"
                  onPress={handleLocation}
                  themeColors={themeColors}
                />
                {bioCapable.available && (
                  <PermItem
                    icon="shield"
                    label={bioCapable.label + ' Unlock'}
                    desc="Instant biometric password-free login"
                    status={biometricEnabled ? 'Enabled' : 'Enable'}
                    active={biometricEnabled}
                    color="#0284C7"
                    onPress={handleToggleBiometrics}
                    themeColors={themeColors}
                  />
                )}
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Footer Navigation & Controls */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagingDotsWrap}>
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => {
            const isActive = activeSlide === i;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  isActive
                    ? [styles.activeDot, { backgroundColor: '#02569B' }]
                    : [styles.inactiveDot, { backgroundColor: isLight ? '#C6DCED' : 'rgba(255,255,255,0.22)' }],
                ]}
              />
            );
          })}
        </View>

        {/* Masterpiece CTA Button */}
        <PressScale
          style={styles.ctaButtonContainer}
          pressedStyle={styles.ctaButtonPressed}
          scaleTo={0.97}
          onPress={handleNext}
        >
          <View style={styles.ctaButtonInner}>
            <View style={styles.ctaButtonHighlight} />
            <Text style={styles.ctaButtonText}>
              {activeSlide === SLIDE_COUNT - 1 ? t.finish : t.next}
            </Text>
            <View style={styles.ctaIconBadge}>
              <Feather name="arrow-right" size={17} color="#FFFFFF" />
            </View>
          </View>
        </PressScale>

        {/* Skip Action */}
        <Pressable onPress={handleCompleteOnboarding} style={styles.skipBtn} hitSlop={12}>
          <Text style={[styles.skipBtnText, { color: isLight ? '#5A738E' : themeColors.textMuted }]}>
            {t.skip}
          </Text>
        </Pressable>
      </View>

      {/* Preferences Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isLight ? '#FFFFFF' : themeColors.card, borderColor: themeColors.border }]}>
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
                  <Pressable
                    key={lang.code}
                    style={[
                      styles.langBtn,
                      { borderColor: isLight ? '#D0E4F2' : themeColors.border },
                      isActive && { backgroundColor: '#02569B', borderColor: '#02569B' },
                    ]}
                    onPress={() => setLangCode(lang.code)}
                  >
                    <Text style={[styles.langBtnText, { color: isActive ? '#fff' : themeColors.text }]}>
                      {lang.label}
                    </Text>
                    {isActive && <Feather name="check" size={12} color="#fff" style={{ marginLeft: 4 }} />}
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.dividerLine, { backgroundColor: isLight ? '#E2E8F0' : themeColors.border }]} />
            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.preferenceLabelText, { color: themeColors.text }]}>{t.themeLabel}</Text>
                <Text style={[styles.preferenceDescText, { color: themeColors.textMuted }]}>
                  {theme === 'dark' ? t.darkMode : t.lightMode}
                </Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: '#CBD5E1', true: '#02569B' }}
                thumbColor={Platform.OS === 'ios' ? undefined : theme === 'dark' ? '#3B82F6' : '#FFFFFF'}
              />
            </View>
            <Pressable
              style={({ pressed }) => [styles.applyBtn, pressed && styles.applyBtnPressed]}
              onPress={async () => {
                await storage.setItem('smaart_pref_language', langCode);
                setModalVisible(false);
              }}
            >
              <Text style={styles.applyBtnText}>{t.apply}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 4 : 10,
    paddingBottom: 6,
  },
  brandBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconWrap: {
    marginRight: 9,
    shadowColor: '#02569B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  brandTextWrap: {
    justifyContent: 'center',
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandNameMain: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    lineHeight: 18,
  },
  brandNameSub: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 2.2,
    lineHeight: 10,
    marginTop: 1,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5.5,
    paddingHorizontal: 11,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#02569B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  langChipPressed: {
    opacity: 0.82,
  },
  langGlobeIcon: {
    marginRight: 5,
  },
  langChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 16,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  slideTitle: {
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 33,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  slideTitleSmall: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: -0.2,
    marginBottom: 5,
  },
  slideDesc: {
    fontSize: 13.5,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 4,
  },
  slideDescSmall: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  permsCardWrap: {
    width: '100%',
    alignItems: 'center',
  },
  permsCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 11,
    shadowColor: '#0F2642',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 18 : 22,
    alignItems: 'center',
  },
  pagingDotsWrap: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3.5,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 6,
  },

  // ── Masterpiece CTA Button Styling ────────────────────────────
  ctaButtonContainer: {
    width: '100%',
    borderRadius: 28,
    shadowColor: '#02569B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaButtonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.98 }],
  },
  ctaButtonInner: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#02569B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  ctaButtonHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  ctaButtonText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginRight: 10,
  },
  ctaIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  skipBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // ── Preferences Modal ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dividerLine: {
    height: 1,
    width: '100%',
    marginVertical: 14,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLabelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  preferenceDescText: {
    fontSize: 11,
    marginTop: 2,
  },
  applyBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#02569B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    ...shadow.button,
  },
  applyBtnPressed: {
    opacity: 0.9,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});