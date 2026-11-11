import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 24 }}>
      <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '700' }}>
        Profile
      </Text>
      <Text>Your reviews and favourite places will go here.</Text>
    </SafeAreaView>
  );
}