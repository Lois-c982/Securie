import AppButton from '@/components/app-button';
import { colours } from '@/constants/theme';
import { places } from '@/data/places';
import { db } from '@/lib/firebase';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { collection, getDocsFromServer, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Image, Modal, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const mapRef = useRef(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const placeId = selectedPlace?.id;

  useEffect(() => {
    if (!placeId) return;

    let active = true;

    async function loadReviews() {
      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('placeId', '==', placeId)
        );
        const snapshot = await getDocsFromServer(reviewsQuery);

        if (active) {
          setReviewResult({
            placeId,
            reviews: snapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            })),
          });
        }
      } catch (error) {
        if (active) {
          console.warn('Could not load reviews:', error.message);
          setReviewResult({ placeId, error: true });
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, [placeId]);

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

      const coordinate = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      setCurrentLocation(coordinate);
      mapRef.current?.animateToRegion({
        ...coordinate,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      });
    } catch {
      setLocationMessage(
        'Couldn’t find your location. You can still browse the map.'
      );
    } finally {
      setIsLocating(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/Securie-logo.png')}
          style={styles.logo}
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

          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: 56.462,
              longitude: -2.9707,
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            }}
          >
            {places.map((place) => (
              <Marker
                key={place.id}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.name}
                onPress={() => {
                  setReviewResult(null);
                  setSelectedPlace(place);
                }}
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

          <AppButton
            label={isLocating ? 'Finding your location…' : 'Find my location'}
            onPress={findMyLocation}
          />

          {locationMessage ? <Text>{locationMessage}</Text> : null}
        </View>

        <View style={styles.bottomButton}>
          <AppButton
            label="Quick Help"
            onPress={() => router.navigate('/help')}
          />
        </View>
      </View>

      <Modal
        visible={selectedPlace !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPlace(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text accessibilityRole="header" style={styles.cardTitle}>
              {selectedPlace?.name}
            </Text>

            {!reviewResult || reviewResult.placeId !== placeId ? (
              <Text>Loading reviews…</Text>
            ) : reviewResult.error ? (
              <Text>
                Couldn’t load reviews. Go back and reopen this place to try again.
              </Text>
            ) : reviewResult.reviews.length === 0 ? (
              <Text>No reviews yet</Text>
            ) : (
              reviewResult.reviews.map((review) => (
                <View key={review.id}>
                  <Text>{review.rating} out of 5 stars</Text>
                  <Text>{review.comment}</Text>
                </View>
              ))
            )}

            <AppButton
              label="Back to map"
              onPress={() => setSelectedPlace(null)}
            />
          </View>
        </View>
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
  logo: {
    width: 64,
    height: 64,
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
  map: {
    width: '100%',
    height: 280,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalCard: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
    backgroundColor: colours.white,
  },
});