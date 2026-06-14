import { Platform } from 'react-native';

export const theme = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  dark: '#1C1C1E',
  label: '#8E8E93',
  separator: '#E5E5EA',
  green: '#34C759',
  greenBg: '#E8F8ED',
  red: '#FF3B30',
  redBg: '#FFEBEA',
  blue: '#007AFF',
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
