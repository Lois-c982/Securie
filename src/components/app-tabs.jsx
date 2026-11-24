import { colours } from '@/constants/theme';
import { NativeTabs } from 'expo-router/native-tabs';

export default function AppTabs() {
  // The selected tab uses the bright pink from the wireframe navigation.
  return (
    <NativeTabs
      backgroundColor={colours.white}
      indicatorColor={colours.brandPink}
      labelStyle={{
        default: { color: colours.textSecondary },
        selected: { color: colours.buttonText },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="help">
        <NativeTabs.Trigger.Label>Help</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="questionmark.circle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}