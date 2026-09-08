import { Platform } from 'react-native';
import {
  BRAND_BLUE,
  BRAND_BLUE_DARK,
  BRAND_BLUE_LIGHT,
  BRAND_DARK,
} from './brand';

export const theme = {
  bg: '#F4F8FF',
  surface: '#FFFFFF',
  dark: BRAND_DARK,
  label: '#64748B',
  separator: '#E2E8F0',
  green: BRAND_BLUE,
  greenBg: BRAND_BLUE_LIGHT,
  success: BRAND_BLUE,
  successBg: BRAND_BLUE_LIGHT,
  red: BRAND_BLUE,
  redBg: BRAND_BLUE_LIGHT,
  primary: BRAND_BLUE,
  primaryDark: BRAND_BLUE_DARK,
  blue: BRAND_BLUE,
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
    sm: 14,
    md: 18,
    lg: 22,
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
