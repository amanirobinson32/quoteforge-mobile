import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from './AppButton';
import { colors, radii } from './theme';

type EmptyStateProps = {
  title: string;
  message: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
};

export function EmptyState({ title, message, primaryAction, secondaryAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {primaryAction ? (
        <View style={styles.actions}>
          <AppButton fullWidth label={primaryAction.label} onPress={primaryAction.onPress} />
          {secondaryAction ? (
            <AppButton fullWidth label={secondaryAction.label} onPress={secondaryAction.onPress} variant="secondary" />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceAlt,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  message: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 10,
    marginTop: 14,
  },
});
