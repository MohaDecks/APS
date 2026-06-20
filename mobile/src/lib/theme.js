import { Platform } from 'react-native';
import { BRAND_RED, BRAND_RED_DARK, BRAND_RED_LIGHT, BRAND_DARK } from './brand';

export const theme = {
  bg: '#f4f4f5',
  surface: '#FFFFFF',
  dark: BRAND_DARK,
  label: '#71717a',
  separator: '#e4e4e7',
  green: BRAND_RED,
  greenBg: BRAND_RED_LIGHT,
  success: BRAND_RED,
  successBg: BRAND_RED_LIGHT,
  red: BRAND_RED,
  redBg: BRAND_RED_LIGHT,
  primary: BRAND_RED,
  primaryDark: BRAND_RED_DARK,
  blue: BRAND_RED,
  font: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'ui-monospace, Menlo, monospace',
  }),
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
  },
  space: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
};
