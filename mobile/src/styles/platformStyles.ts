/**
 * Platform-Specific Styles
 * iOS and Android specific styling
 */

import { Platform, StyleSheet } from 'react-native';
import { theme } from './theme';

/**
 * iOS-specific styles
 */
export const iosStyles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  navigation: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.borderPrimary,
  },
  card: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    borderRadius: theme.borderRadius.pill,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
});

/**
 * Android-specific styles
 */
export const androidStyles = StyleSheet.create({
  elevation: {
    elevation: 5,
  },
  navigation: {
    backgroundColor: theme.colors.backgroundSecondary,
    elevation: 4,
  },
  card: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    elevation: 3,
  },
  button: {
    borderRadius: theme.borderRadius.pill,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    elevation: 2,
  },
  ripple: {
    borderless: false,
    color: 'rgba(255, 255, 255, 0.12)',
  },
});

/**
 * Get platform-specific style
 */
export const getPlatformStyle = <T,>(iosStyle: T, androidStyle: T): T => {
  return Platform.select({
    ios: iosStyle,
    android: androidStyle,
    default: iosStyle,
  }) as T;
};

/**
 * Common platform-agnostic styles
 */
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundPrimary,
  },
  cardPolygon: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderPrimary,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.pill,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.pill,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textPrimary: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
  },
  textSecondary: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  heading: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderPrimary,
    marginVertical: theme.spacing.md,
  },
});

export default {
  ios: iosStyles,
  android: androidStyles,
  common: commonStyles,
  getPlatformStyle,
};
