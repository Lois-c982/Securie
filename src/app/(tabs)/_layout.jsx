//organises the tabs in the app, and is used in the layout of the app. It is a wrapper around the AppTabs component, which is imported from the components folder. The AppTabs component is responsible for rendering the tabs and handling navigation between them.
import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  // This navigator contains Map, Help and Profile.
  return <AppTabs />;
}