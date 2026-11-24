import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colours } from '@/constants/theme';

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'medium',
  accessibilityLabel,
  accessibilityHint,
}) {
  const [focused, setFocused] = useState(false);

  // I prevent another action while the button is unavailable.
  const unavailable = disabled || loading;

  const buttonVariant = [
    'primary',
    'secondary',
    'outline',
  ].includes(variant)
    ? variant
    : 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: unavailable,
        busy: loading,
      }}
      disabled={unavailable}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.button,
        styles[buttonVariant],
        size === 'small' && styles.small,
        pressed && !unavailable && styles.pressed,
        unavailable && styles.disabled,
        focused && styles.focused,
      ]}
    >
      <Text
        allowFontScaling
        style={[
          styles.label,
          size === 'small' && styles.smallLabel,
          unavailable && styles.disabledLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // I use generous touch areas and allow labels to wrap.
  button: {
    minHeight: 54,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },

  // I match the primary buttons to the pale pink header label.
primary: {
  backgroundColor: colours.selected,
  borderColor: colours.border,
},

  // Blue identifies supporting actions.
  secondary: {
    backgroundColor: colours.softBlue,
    borderColor: colours.blueBorder,
  },

  outline: {
    backgroundColor: colours.white,
    borderColor: colours.border,
  },

  // Smaller buttons still retain a comfortable touch area.
  small: {
    alignSelf: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  // Black text stays readable on both pink and blue.
  label: {
    color: colours.buttonText,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },

  smallLabel: {
    fontSize: 15,
  },

  // I use immediate visual feedback without adding animation.
  pressed: {
    backgroundColor: colours.selected,
    borderColor: colours.text,
  },

  disabled: {
    backgroundColor: colours.muted,
    borderColor: colours.border,
  },

  disabledLabel: {
    color: colours.textSecondary,
  },

  // The border pattern makes keyboard focus visible
  // without relying only on a colour change.
  focused: {
    borderStyle: 'dashed',
    borderColor: colours.focus,
  },
});