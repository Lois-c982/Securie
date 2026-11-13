import MapView, { Marker } from 'react-native-maps';
import { Image, StyleSheet, Text, View, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colours } from '@/constants/theme';
import AppButton from '@/components/app-button';
import { places } from '@/data/places';
import { useState, useRef } from 'react';
import * as Location from 'expo-location';


export default function HomeScreen() {
  const router = useRouter();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const mapRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);


  async function findMyLocation() {
  if (isLocating) return;

  setIsLocating(true);
  setLocationMessage('');

  try {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      setLocationMessage(
        'Location access is off. You can still browse Dundee and tap any pin.'
      );
      return;
    }

    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    {/*Update the current location state with the user's coordinates. This will be used to center the map on the user's location.*/}
    setCurrentLocation({
  latitude: coords.latitude,
  longitude: coords.longitude,
  });

    mapRef.current?.animateToRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.025,
      longitudeDelta: 0.025,
    });
  } catch {
    setLocationMessage('We Could not find your location. You can still browse the map.');
  } finally {
    setIsLocating(false);
  }
}

  return (
    // SafeAreaView ensures the content sits within the device's safe area, avoiding notches and screen cutouts.
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/Securie-logo.png')}
          style={{ width: 64, height: 64 }}
          resizeMode="contain"
          accessible={false}
        />
        <Text style={styles.brand}>Securie</Text>
        <Text style={styles.subtitle}>Dundee Women’s Safety</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>Safety tips for Women, by Women</Text>
        <Text style={styles.description}>
          Explore Dundee without fear, explore places highly rated by women.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Explore the map</Text>

          {/* The map gives users a quick view of nearby places and lets them tap a pin for more info. */}
          <MapView ref={mapRef}
            style={{ width: '100%', height: 280 }}
            initialRegion={{
              latitude: 56.462,
              longitude: -2.9707,
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            }}>
            {places.map((place) => (
              <Marker
                key={place.id}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.name}
                onPress={() => setSelectedPlace(place)}
              />
            ))}

            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                 pinColor="#adc7d5"
                 title="You are here"
                description="Last location found"
               />
            )}
          </MapView>
           
          {/* this button allows users to share live locations */}
          <AppButton
             label={isLocating ? 'Finding your location…' : 'Find my location'}
            onPress={findMyLocation}
         />

        {locationMessage ? <Text>{locationMessage}</Text> : null}
         </View>

          <View style={styles.bottomButton}>
          <AppButton label="Quick Help" onPress={() => router.navigate('/help')} />
         </View>
        </View>

      {/* This modal shows a quick location detail when the user taps a map marker. */}
      <Modal
        visible={selectedPlace !== null}
        animationType="slide"
        onRequestClose={() => setSelectedPlace(null)}>
        <SafeAreaView style={styles.screen}>
          <View style={styles.content}>
            <Text accessibilityRole="header" style={styles.heading}>
              {selectedPlace?.name}
            </Text>
            <Text style={styles.description}>Sample location</Text>
            <Text style={styles.description}>No reviews yet</Text>

            <AppButton label="Back to map" onPress={() => setSelectedPlace(null)} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colours.background,
  },
  header: {
    padding: 24,
    backgroundColor: colours.header,
    alignItems: 'center',
  },
  brand: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colours.accent,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: colours.accent,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  bottomButton: {
    marginTop: 'auto',
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: colours.accent,
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
    color: colours.accent,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colours.white,
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colours.accent,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: colours.accent,
  },
});