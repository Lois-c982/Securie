import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 24 }}>
      <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '700' }}>
        Help
      </Text>
      <Text>Important contacts and the simulated call will go here.</Text>
    </SafeAreaView>
  );
}