import { Pressable, Text, StyleSheet, ActivityIndicator, type PressableProps } from 'react-native';
import type { ReactNode } from 'react';
import { colors, radius } from '../lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends PressableProps {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', loading, disabled, children, style, ...rest }: Props) {
  const variantStyle = styles[variant];
  const textVariantStyle = textStyles[variant];
  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.ink : colors.paper} />
      ) : (
        <Text style={[styles.text, textVariantStyle]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: { backgroundColor: colors.ink },
  secondary: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.ink },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.accent },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  text: { fontSize: 15, fontWeight: '600' },
});

const textStyles = StyleSheet.create({
  primary: { color: colors.paper },
  secondary: { color: colors.ink },
  ghost: { color: colors.ink },
  danger: { color: colors.paper },
});
