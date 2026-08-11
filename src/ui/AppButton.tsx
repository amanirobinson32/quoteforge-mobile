import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radii } from './theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string;
  small?: boolean;
  style?: ViewStyle;
  variant?: ButtonVariant;
};

export function AppButton({
  label,
  onPress,
  accessibilityLabel,
  disabled,
  fullWidth,
  icon,
  small,
  style,
  variant = 'primary',
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        small && styles.small,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {icon ? <Text style={[styles.icon, variant === 'primary' && styles.primaryText]}>{icon}</Text> : null}
      <Text style={[styles.label, variant === 'primary' && styles.primaryText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  small: {
    minHeight: 42,
    paddingHorizontal: 12,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  icon: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  primaryText: {
    color: colors.surface,
  },
});
