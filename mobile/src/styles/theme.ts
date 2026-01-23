/**
 * Theme Configuration
 * Polygon brand design system for mobile
 */

export const colors = {
  // Primary Colors (Polygon purple)
  primary: '#6A23E7',
  primaryLight: '#9A60FF',
  primaryHover: '#5E31EB',
  primaryDark: '#4A1BAF',

  // Background Colors
  backgroundPrimary: '#0A090D',
  backgroundSecondary: '#141217',
  backgroundTertiary: '#1E1C23',

  // Text Colors
  textPrimary: '#F3F5FF',
  textSecondary: '#9AA3B2',
  textTertiary: '#6B7280',

  // Border Colors
  borderPrimary: 'rgba(255, 255, 255, 0.08)',
  borderSecondary: 'rgba(255, 255, 255, 0.05)',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Semantic Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12, // Polygon card radius
  xl: 16,
  pill: 100, // Polygon button radius
  round: 9999,
};

export const typography = {
  fontFamily: {
    regular: 'Montserrat-Regular',
    medium: 'Montserrat-Medium',
    semiBold: 'Montserrat-SemiBold',
    bold: 'Montserrat-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
};

export type Theme = typeof theme;

export default theme;
