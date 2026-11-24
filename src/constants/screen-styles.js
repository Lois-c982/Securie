import { StyleSheet } from 'react-native';

import { colours, MaxContentWidth } from '@/constants/theme';

// I share these styles so cards, forms and text look
// consistent across the main screens.
export const screenStyles = StyleSheet.create({
  // The pale pink background separates the white content cards.
  screen: {
    flex: 1,
    backgroundColor: colours.background,
  },

  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    gap: 20,
  },

  sectionTitle: {
    color: colours.text,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  // I use a blue top border to give cards a shared visual identity.
  card: {
    backgroundColor: colours.white,
    borderWidth: 1,
    borderColor: colours.divider,
    borderTopWidth: 5,
    borderTopColor: colours.softBlue,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },

  cardTitle: {
    color: colours.text,
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  body: {
    color: colours.text,
    fontSize: 16,
    lineHeight: 25,
  },

  supporting: {
    color: colours.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },

  label: {
    color: colours.text,
    fontSize: 16,
    fontWeight: '600',
  },

  // I use a minimum height instead of a fixed height so
  // inputs can accommodate larger device text settings.
  input: {
    minHeight: 54,
    backgroundColor: colours.paleBlue,
    color: colours.text,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },

  // Notices use dark text, a tinted background and a pink accent.
  notice: {
    backgroundColor: colours.selected,
    color: colours.text,
    borderLeftWidth: 4,
    borderLeftColor: colours.brandPink,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    lineHeight: 24,
  },
});