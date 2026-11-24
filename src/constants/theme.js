import { Platform } from 'react-native';

// I use pink and blue for the app's identity, with dark text
// so information stays readable on the coloured backgrounds.
export const colours = {
  header: '#ADC7D5',
  background: '#FFF5F9',
  white: '#FFFFFF',

  brandPink: '#E6417D',
  softBlue: '#ADC7D5',
  selected: '#FCE4EE',

  text: '#000000',
  textSecondary: '#454545',
  accent: '#000000',

  button: '#E6417D',
  buttonText: '#000000',

  border: '#767076',
  outline: '#767076',
  blueBorder: '#526B78',

  divider: '#E9D9E1',
  muted: '#EEEEEE',
  focus: '#000000',

  // I use lighter versions of the brand colours for larger areas.
  paleBlue: '#EDF4F8',
  palePink: '#FFF5F9',
};

// I keep these exports because Expo starter components may use them.
// Screens importing colours directly use the palette above;
// this export alone does not enable app-wide dark mode.
export const Colors = {
  light: {
    ...colours,
    backgroundElement: colours.white,
    backgroundSelected: colours.selected,
  },

  dark: {
    ...colours,
    text: '#F8F5FA',
    textSecondary: '#D3CAD9',
    background: '#211A27',
    header: '#211A27',
    backgroundElement: '#302637',
    backgroundSelected: '#49334B',
    white: '#302637',
    accent: '#F8BDD4',
    border: '#B8A9C2',
  },
};

// I use system fonts so the app does not need extra font downloads.
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },

  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },

  web: {
    sans: 'system-ui',
    serif: 'serif',
    rounded: 'system-ui',
    mono: 'monospace',
  },
});

// I reuse a spacing scale to keep layouts consistent.
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
};

export const BottomTabInset =
  Platform.select({ ios: 50, android: 80 }) ?? 0;

export const MaxContentWidth = 800;