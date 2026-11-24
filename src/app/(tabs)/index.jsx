// Main Map screen for exploring places in Dundee.
import AppButton from '@/components/app-button';
import ReviewForm from '@/components/review-form';
import ScreenHeader from '@/components/screen-header';
import { screenStyles } from '@/constants/screen-styles';
import { colours } from '@/constants/theme';
import { places } from '@/data/places';
import { useFavourites } from '@/lib/favourites';
import { auth, db } from '@/lib/firebase';
import { distanceKm, filterPlaces } from '@/lib/place-search';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocsFromServer, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const mapRef = useRef(null);
  const deletingReview = useRef(false);
  const locating = useRef(false);
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const initialRegion = { latitude: 56.462, longitude: -2.9707, latitudeDelta: 0.025, longitudeDelta: 0.025 };
  const [searchRegion, setSearchRegion] = useState(null);
  const matchingPlaces = useMemo(
    () => filterPlaces(places, appliedSearch, searchRegion),
    [appliedSearch, searchRegion]
  );

  // Apply the search text and fit the map to matching places.
  function searchPlaces() {
    setAppliedSearch(searchText.trim());
    setSearchRegion(null);
    const matches = filterPlaces(places, searchText, null);
    if (matches.length) mapRef.current?.fitToCoordinates(matches.map(({ latitude, longitude }) => ({ latitude, longitude })), {
      edgePadding: { top: 45, right: 45, bottom: 45, left: 45 }, animated: true,
    });
  }

  // Clear the search and show all places again.
  function clearSearch() {
    setSearchText('');
    setAppliedSearch('');
    setSearchRegion(null);
  }

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [user, setUser] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const {
    favouriteIds,
    loading: favouritesLoading,
    saving: favouritesSaving,
    loadError: favouritesLoadError,
    saveError: favouritesSaveError,
    toggleFavourite,
  } = useFavourites();

  const placeId = selectedPlace?.id;
  const isFavourite = favouriteIds.includes(placeId);
  const resultForPlace = reviewResult?.placeId === placeId ? reviewResult : null;
  const reviews = resultForPlace?.reviews ?? [];
  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviewCount
    : null;

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setEditingReviewId(null);
    });
  }, []);

  // Load reviews for the selected place, ignoring results after it closes.
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
            reviews: snapshot.docs.map((reviewDoc) => ({
              ...reviewDoc.data(),
              id: reviewDoc.id,
            })),
          });
        }
      } catch (error) {
        if (active) {
          console.warn('Could not load reviews:', error.message);
          setReviewResult({ placeId, error: true });
          setEditingReviewId(null);
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, [placeId, reviewRefresh]);

  function refreshReviews() {
    setReviewRefresh((previous) => previous + 1);
  }

  function finishEditing(reviewId) {
    setEditingReviewId((current) => (current === reviewId ? null : current));
    refreshReviews();
  }

  // Ask before deleting a review, then refresh it after deletion.
  function confirmDeleteReview(review) {
    Alert.alert('Delete your review?', 'This will remove it from this place.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (deletingReview.current) return;
          deletingReview.current = true;

          try {
            await deleteDoc(doc(db, 'reviews', review.id));
            finishEditing(review.id);
          } catch {
            Alert.alert('Couldn’t delete the review', 'Please try again.');
          } finally {
            deletingReview.current = false;
          }
        },
      },
    ]);
  }

  // Find the user's location and update nearby results.
  async function findMyLocation() {
    if (locating.current) return;
    locating.current = true;

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
      const coordinate = { latitude: coords.latitude, longitude: coords.longitude };

      setCurrentLocation(coordinate);
      const nearbyRegion = { ...coordinate, latitudeDelta: 0.025, longitudeDelta: 0.025 };
      setSearchRegion(nearbyRegion);
      setAppliedSearch(searchText.trim());
      mapRef.current?.animateToRegion(nearbyRegion);
    } catch {
      setLocationMessage('Couldn’t find your location. You can still browse the map.');
    } finally {
      locating.current = false;
      setIsLocating(false);
    }
  }

  
  async function openWebsite(url) {
    if (!/^https?:\/\//i.test(url || '')) return;
    try { await Linking.openURL(url); }
    catch { Alert.alert('Couldn’t open the link', 'Please try again later.'); }
  }

  function openPlace(place) {
    setEditingReviewId(null);
    setReviewResult(null);
    setSelectedPlace(place);
  }

  function closePlace() {
    setEditingReviewId(null);
    setSelectedPlace(null);
  }

  return (
    <SafeAreaView style={screenStyles.screen} edges={['top', 'left', 'right']}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Map"
          description="Explore Dundee and read how other women felt in different places."
        />

        <View style={screenStyles.content}>
          <Text accessibilityRole="header" style={screenStyles.sectionTitle}>
            Explore the map
          </Text>

          <View style={screenStyles.card}>
            <Text style={screenStyles.cardTitle}>Dundee map</Text>
            <Text style={screenStyles.supporting}>Search our Dundee places by name or type, then tap a pin or result.</Text>
            <Text accessibilityRole="header" style={screenStyles.label}>Find a place</Text>
            <TextInput
              accessibilityLabel="Search Dundee places by name or type"
              placeholder="Try hospitals, police stations or restaurants"
              placeholderTextColor={colours.textSecondary}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={searchPlaces}
              returnKeyType="search"
              maxLength={100}
              autoCorrect={false}
            />
            <AppButton label="Search Dundee places" onPress={searchPlaces} />
            {(appliedSearch || searchRegion || searchText) ? (
              <AppButton label="Clear search and show all places" variant="outline" onPress={clearSearch} />
            ) : null}

            {/* Frame the map to match the home-screen wireframe. */}
            <View style={styles.mapFrame}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={initialRegion}
              
              >
                {matchingPlaces.map((place) => (
                  <Marker
                    key={place.id}
                    coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                    title={place.name}
                    description={place.category || place.description}
                    onPress={() => openPlace(place)}
                  />
                ))}

                {currentLocation ? (
                  <Marker
                    coordinate={currentLocation}
                    pinColor={colours.softBlue}
                    title="You are here"
                    description="Last location found"
                  />
                ) : null}
              </MapView>
            </View>

            <AppButton
              label={isLocating ? 'Finding your location…' : 'Find places near me'}
              onPress={findMyLocation}
              disabled={isLocating}
            />

            {locationMessage ? (
              <Text style={screenStyles.notice}>{locationMessage}</Text>
            ) : null}
          </View>

          <View style={screenStyles.card}>
            <Text accessibilityRole="header" style={screenStyles.cardTitle}>Places found</Text>
            <Text accessibilityLiveRegion="polite" style={screenStyles.supporting}>
              {matchingPlaces.length} {matchingPlaces.length === 1 ? 'place' : 'places'} found{searchRegion ? ' in this area' : ' in our Dundee dataset'}.
            </Text>
            {matchingPlaces.length === 0 ? (
              <Text style={screenStyles.notice}>No matching places in the saved dataset. Try another name or type, zoom out, or clear the search. This does not mean no facilities exist nearby.</Text>
            ) : matchingPlaces.map((place) => (
              <Pressable key={place.id} accessibilityRole="button" accessibilityLabel={`View ${place.name}, ${place.category || 'place'}${place.address ? `, ${place.address}` : ''}`} style={styles.result} onPress={() => openPlace(place)}>
                <Text style={screenStyles.label}>{place.name}</Text>
                <Text style={screenStyles.supporting}>{place.category || 'Place'}</Text>
                {place.address ? <Text style={screenStyles.supporting}>{place.address}</Text> : null}
                {currentLocation ? <Text style={screenStyles.supporting}>{distanceKm(currentLocation, place).toFixed(1)} km away in a straight line</Text> : null}
              </Pressable>
            ))}
            <Text style={screenStyles.supporting}>Place data © OpenStreetMap contributors (ODbL). Imported 21 November 2026. Coverage and details may be incomplete.</Text>
            <AppButton label="About OpenStreetMap data" variant="outline" onPress={() => openWebsite('https://www.openstreetmap.org/copyright')} />
          </View>

          <AppButton label="Quick Help" variant="secondary" onPress={() => router.navigate('/help')} />
        </View>
      </ScrollView>

      {/* Show the selected place's details and let users manage its reviews. */}
      <Modal
        visible={selectedPlace !== null}
        transparent
        animationType="fade"
        onRequestClose={closePlace}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalCard}
            automaticallyAdjustKeyboardInsets
            keyboardShouldPersistTaps="handled"
          >
            <Text accessibilityRole="header" style={screenStyles.cardTitle}>
              {selectedPlace?.name}
            </Text>
            <Text style={screenStyles.body}>{selectedPlace?.description || `${selectedPlace?.category || 'Place'} in the Dundee area. Further information is not available.`}</Text>
            {selectedPlace?.address ? <Text style={screenStyles.supporting}>{selectedPlace.address}</Text> : null}
            {selectedPlace?.openingHours ? <Text style={screenStyles.supporting}>Listed opening hours: {selectedPlace.openingHours}. Check with the venue before travelling.</Text> : null}
            {selectedPlace?.website && /^https?:\/\//i.test(selectedPlace.website) ? <AppButton label="Visit place website" variant="outline" onPress={() => openWebsite(selectedPlace.website)} /> : null}
            {selectedPlace?.sourceUrl ? <AppButton label="View OpenStreetMap source" variant="outline" onPress={() => openWebsite(selectedPlace.sourceUrl)} /> : null}

            {favouritesLoading ? (
              <Text style={screenStyles.supporting}>Loading favourites…</Text>
            ) : favouritesLoadError ? (
              <Text accessibilityRole="alert" style={screenStyles.notice}>
                {favouritesLoadError}
              </Text>
            ) : placeId ? (
              <AppButton
                label={
                  favouritesSaving ? 'Updating favourites…'
                    : isFavourite ? 'Remove from favourites' : 'Save to favourites'
                }
                variant="secondary"
                disabled={favouritesSaving}
                onPress={() => toggleFavourite(placeId)}
              />
            ) : null}

            {favouritesSaveError ? (
              <Text accessibilityRole="alert" style={screenStyles.notice}>
                {favouritesSaveError}
              </Text>
            ) : null}

            {averageRating !== null ? (
              <Text style={styles.ratingSummary}>
                {averageRating.toFixed(1)} out of 5 from {reviewCount}{' '}
                {reviewCount === 1 ? 'review' : 'reviews'}
              </Text>
            ) : null}

            {!resultForPlace ? (
              <Text style={screenStyles.supporting}>Loading reviews…</Text>
            ) : resultForPlace.error ? (
              <Text style={screenStyles.notice}>
                Couldn’t load reviews. Go back and reopen this place to try again.
              </Text>
            ) : reviewCount === 0 ? (
              <Text style={screenStyles.supporting}>No reviews yet</Text>
            ) : (
              reviews.map((review) => {
                const isOwner = Boolean(user && review.userId === user.uid);
                const isEditing = isOwner && editingReviewId === review.id;

                return (
                  <View key={review.id} style={styles.review}>
                    {isEditing ? (
                      <>
                        <ReviewForm
                          placeId={placeId}
                          review={review}
                          onSaved={() => finishEditing(review.id)}
                        />
                        <AppButton
                          label="Cancel edit"
                          variant="outline"
                          onPress={() => setEditingReviewId(null)}
                        />
                      </>
                    ) : (
                      <>
                        <Text style={screenStyles.label}>{review.rating} out of 5 stars</Text>
                        <Text style={screenStyles.body}>{review.comment}</Text>

                        {isOwner && editingReviewId === null ? (
                          <>
                            <AppButton
                              label="Edit review"
                              variant="outline"
                              onPress={() => setEditingReviewId(review.id)}
                            />
                            <AppButton
                              label="Delete review"
                              variant="outline"
                              onPress={() => confirmDeleteReview(review)}
                            />
                          </>
                        ) : null}
                      </>
                    )}
                  </View>
                );
              })
            )}

            {placeId && editingReviewId === null ? (
              <ReviewForm key={placeId} placeId={placeId} onSaved={refreshReviews} />
            ) : null}

            <AppButton label="Back to map" variant="outline" onPress={closePlace} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  searchInput: { minHeight: 48, borderWidth: 1, borderColor: colours.outline, borderRadius: 8, padding: 12, fontSize: 16, color: colours.text, backgroundColor: colours.white },
  result: { minHeight: 48, paddingVertical: 12, gap: 4, borderBottomWidth: 1, borderColor: colours.outline },
  mapFrame: {
    borderColor: colours.softBlue,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: { width: '100%', height: 264 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(32, 13, 24, 0.48)',
  },
  modalScroll: {
    flexGrow: 0,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    borderRadius: 12,
    backgroundColor: colours.white,
  },
  modalCard: { padding: 16, gap: 12 },
  ratingSummary: {
    color: colours.text,
    fontSize: 15,
    fontWeight: '700',
    backgroundColor: colours.softBlue,
    borderRadius: 8,
    padding: 10,
  },
  review: {
    gap: 8,
    borderWidth: 1,
    borderColor: colours.outline,
    borderRadius: 8,
    padding: 12,
  },
});