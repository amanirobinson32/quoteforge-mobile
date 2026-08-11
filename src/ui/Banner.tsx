import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from './theme';

type BannerTone = 'loading' | 'success' | 'error' | 'empty';

type BannerProps = {
  children: string;
  tone?: BannerTone;
};

export function Banner({ children, tone = 'empty' }: BannerProps) {
  return (
    <View accessibilityRole={tone === 'error' ? 'alert' : undefined} style={[styles.banner, styles[tone]]}>
      <Text style={[styles.text, tone === 'error' && styles.errorText]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 13,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  loading: {
    backgroundColor: colors.amberSoft,
    borderColor: '#ecd2a1',
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: '#abd4c9',
  },
  error: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#e5b0a7',
  },
  empty: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  text: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '700',
  },
});
