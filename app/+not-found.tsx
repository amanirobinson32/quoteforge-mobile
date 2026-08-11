import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/ui/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen not found</Text>
      <Text style={styles.body}>This QuoteForge screen is not available.</Text>

      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Back to Home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 16,
  },
  link: {
    marginTop: 18,
    paddingVertical: 15,
  },
  linkText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});
