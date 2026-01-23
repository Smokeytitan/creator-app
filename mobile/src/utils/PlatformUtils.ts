/**
 * Platform Utilities
 * Cross-platform helper functions for iOS and Android
 */

import { Platform, Dimensions } from 'react-native';

export const PlatformUtils = {
  /**
   * Check if running on iOS
   */
  isIOS: Platform.OS === 'ios',

  /**
   * Check if running on Android
   */
  isAndroid: Platform.OS === 'android',

  /**
   * Platform-specific value selector
   * @example
   * const height = PlatformUtils.select({
   *   ios: 44,
   *   android: 56,
   *   default: 50
   * });
   */
  select: <T>(options: { ios?: T; android?: T; default: T }): T => {
    return (
      Platform.select({
        ios: options.ios,
        android: options.android,
        default: options.default,
      }) ?? options.default
    );
  },

  /**
   * Get platform-specific navigation bar height
   */
  getNavigationHeight: (): number => {
    return Platform.select({
      ios: 44, // iOS navigation bar height
      android: 56, // Android action bar height
      default: 50,
    });
  },

  /**
   * Get platform-specific status bar height
   */
  getStatusBarHeight: (): number => {
    return Platform.select({
      ios: 20,
      android: 24,
      default: 20,
    });
  },

  /**
   * Get device screen dimensions
   */
  getScreenDimensions: () => {
    return Dimensions.get('window');
  },

  /**
   * Check if device is a tablet
   */
  isTablet: (): boolean => {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    return aspectRatio < 1.6; // Tablets typically have aspect ratios closer to 1.33
  },

  /**
   * Get platform-specific shadow style
   */
  getShadowStyle: (elevation: number = 4) => {
    if (Platform.OS === 'ios') {
      return {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: elevation / 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: elevation,
      };
    }
    return {
      elevation,
    };
  },

  /**
   * Get platform version
   */
  getOSVersion: (): string | number => {
    return Platform.Version;
  },
};

/**
 * Responsive breakpoints based on device width
 */
export const useResponsiveBreakpoints = () => {
  const { width } = Dimensions.get('window');

  return {
    isSmall: width < 375, // iPhone SE
    isMedium: width >= 375 && width < 414, // Standard phones
    isLarge: width >= 414 && width < 768, // Large phones
    isTablet: width >= 768, // iPads and tablets
    width,
  };
};

/**
 * Safe area insets helper
 */
export const SafeAreaHelper = {
  /**
   * Get safe area insets for notched devices
   */
  getInsets: () => {
    if (Platform.OS === 'ios') {
      // iOS 11+ with notch support
      return {
        top: 44,
        bottom: 34,
        left: 0,
        right: 0,
      };
    }
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
  },
};

export default PlatformUtils;
