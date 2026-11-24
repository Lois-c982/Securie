import { StyleSheet, Text, View } from 'react-native';

import { colours, MaxContentWidth } from '@/constants/theme';

export default function ScreenHeader({ title, description }) {
  return (
    <View style={styles.header}>
      {/* I keep this decorative shape hidden from screen readers. */}
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.decoration}
      />

      <View style={styles.inner}>
        {/* I use the app name without the logo to simplify the header. */}
        <View style={styles.brandText}>
          <Text style={styles.brand}>Securie</Text>

          <Text style={styles.tagline}>
            Dundee Women’s Safety
          </Text>
        </View>

        <View style={styles.headingArea}>
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>
              YOUR DUNDEE COMPANION
            </Text>
          </View>

          <Text
            accessibilityRole="header"
            style={styles.title}
          >
            {title}
          </Text>

          {description ? (
            <Text style={styles.description}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colours.softBlue,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },

  decoration: {
    position: 'absolute',
    right: -45,
    top: -55,
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 28,
    borderColor: colours.selected,
  },

  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
  },

  brandText: {
    gap: 3,
  },

  brand: {
    color: colours.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },

  tagline: {
    color: colours.text,
    fontSize: 14,
  },

  headingArea: {
    marginTop: 24,
    gap: 12,
  },

  locationBadge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: colours.selected,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  locationText: {
    color: colours.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  title: {
    color: colours.text,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.7,
  },

  description: {
    color: colours.text,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 560,
  },
});