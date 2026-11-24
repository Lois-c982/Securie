import { colours } from '@/constants/theme';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function AppTabs() {
  return (
    <Tabs style={styles.container}>
      <TabSlot style={styles.container} />
      <TabList asChild>
        <View style={styles.tabList}>
          <TabTrigger name="index" href="/(tabs)" asChild>
            <TabButton>Map</TabButton>
          </TabTrigger>
          <TabTrigger name="help" href="/help" asChild>
            <TabButton>Help</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>Profile</TabButton>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.tabLabel}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Keep navigation below the content so it can't cover screen controls.
  tabList: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colours.white,
    borderTopWidth: 1,
    borderColor: colours.outline,
  },
  tabButton: {
    minWidth: 88,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selected: { backgroundColor: colours.brandPink },
  pressed: { opacity: 0.84 },
  tabLabel: { color: colours.buttonText, fontSize: 14, fontWeight: '700' },
});