import { StyleSheet, Text, View } from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    
    // SafeAreaView ensures that the content is displayed within the safe area boundaries of a device, avoiding notches and other screen obstructions.
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>Securie</Text>
        <Text style={styles.subtitle}>Dundee Women's Safety</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>Safety tips for Women, by Women</Text>
      <Text style={styles.description}>Explore Dundee without fear, Explore places highly rated by Women</Text>

<View style={styles.card}> 
  <Text style={styles.cardTitle}>Explore the map</Text>
  <Text style={styles.cardText}>
    The Interactive map will be here (Placeholder for now).
  </Text>
</View>
</View>
</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FBEFF1'
  }, 
   header: {
    padding: 24,
    backgroundColor: '#F1A9AD',
    alignItems: 'center',
  },
  brand: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E6417D',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#E6417D',
  }, 
  content: {
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#E6417D',
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
    color: '#E6417D',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E6417D',
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#E6417D',
  },
});