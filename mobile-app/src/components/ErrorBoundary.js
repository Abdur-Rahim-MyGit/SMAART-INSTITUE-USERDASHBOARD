/**
 * ErrorBoundary — last line of defense against a render crash.
 *
 * Wraps the whole app in App.js, outside every context provider, since it
 * has to survive even a provider itself throwing. Uses the static theme.js
 * palette rather than ThemeContext for that same reason — ThemeContext may
 * not be mounted by the time this renders its fallback.
 *
 * Deliberately does not report to a crash service (Sentry/Bugsnag) — wiring
 * one up is an account/DSN decision this pass doesn't have, matching how
 * push notifications' FCM credentials were left as an explicit follow-up
 * rather than guessed at.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>!</Text>
        </View>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          The app hit an unexpected error. Try again — if it keeps happening, contact your
          institution administrator.
        </Text>

        <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={this.handleReset}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>

        {__DEV__ ? (
          <ScrollView style={styles.debugBox} contentContainerStyle={{ padding: 12 }}>
            <Text style={styles.debugText}>{String(this.state.error?.stack || this.state.error)}</Text>
          </ScrollView>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDarkest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconGlyph: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.danger,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  button: {
    height: 50,
    paddingHorizontal: 28,
    borderRadius: radius.pill || 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.primaryBright,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  debugBox: {
    marginTop: 24,
    maxHeight: 180,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  debugText: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'monospace',
  },
});
