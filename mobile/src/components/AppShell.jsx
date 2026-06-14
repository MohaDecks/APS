import { View, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

export default function AppShell({ children }) {
  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.bg,
  },
});
