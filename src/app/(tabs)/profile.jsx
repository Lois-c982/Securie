import AppButton from '@/components/app-button';
import ReviewForm from '@/components/review-form';
import ScreenHeader from '@/components/screen-header';
import { screenStyles } from '@/constants/screen-styles';
import { colours } from '@/constants/theme';
import { places } from '@/data/places';
import { useFavourites } from '@/lib/favourites';
import { auth, db } from '@/lib/firebase';
import { useFocusEffect, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, where, } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Convert Firebase timestamps into a readable date.
// Older sample reviews may not have a timestamp.
function reviewDate(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [registering, setRegistering] = useState(false);

  // The same form supports login and registration.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Full name and city belong to the private account document.
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [savedDetails, setSavedDetails] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [publicName, setPublicName] = useState('');

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // A ref blocks repeated taps before React updates the button.
  const actionInProgress = useRef(false);
  const deletingReview = useRef(false);

  const router = useRouter();

  const {
    favouriteIds,
    loading: favouritesLoading,
    saving: favouritesSaving,
    loadError: favouritesLoadError,
    saveError: favouritesSaveError,
    toggleFavourite,
  } = useFavourites();

  const favouritePlaces = places.filter((place) =>
    favouriteIds.includes(place.id)
  );

  const userId = user?.uid;

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingSession(false);
      setPassword('');
      setConfirmPassword('');
      setMessage('');
      setEditingReviewId(null);
    });
  }, []);

  // Refresh personal details when Profile opens or the account changes.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      setEditingReviewId(null);

      if (!userId) {
        setSavedDetails(null);
        setProfileError('');
        setDisplayName('');
        setPublicName('');
        setFullName('');
        setCity('');
        return;
      }

      async function loadProfile() {
        setProfileLoading(true);
        setProfileError('');
        setSavedDetails(null);

        const currentName = auth.currentUser?.displayName ?? '';
        setDisplayName(currentName);
        setPublicName(currentName);

        try {
          const snapshot = await getDoc(doc(db, 'users', userId));
          if (!active) return;

          const data = snapshot.exists() ? snapshot.data() : {};
          const details = {
            displayName: currentName,
            fullName: data.fullName ?? '',
            city: data.city ?? '',
          };

          setFullName(details.fullName);
          setCity(details.city);
          setSavedDetails(details);
        } catch {
          if (active) {
            setProfileError(
              'Couldn’t load your profile details. Reopen Profile to try again.'
            );
          }
        } finally {
          if (active) setProfileLoading(false);
        }
      }

      loadProfile();

      return () => {
        active = false;
      };
    }, [userId])
  );

  // Listen only to this account's reviews while Profile is open.
  // Changes made on the Map tab appear when the user returns here.
  useFocusEffect(
    useCallback(() => {
      setReviews([]);
      setReviewsError('');

      if (!userId) {
        setReviewsLoading(false);
        return;
      }

      setReviewsLoading(true);

      const ownReviewsQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', userId)
      );

      return onSnapshot(
        ownReviewsQuery,
        (snapshot) => {
          const ownReviews = snapshot.docs.map((reviewDoc) => ({
            ...reviewDoc.data(),
            id: reviewDoc.id,
          }));

          // Sort locally to avoid needing a composite database index.
          ownReviews.sort(
            (a, b) =>
              (b.createdAt?.toMillis?.() ?? 0) -
              (a.createdAt?.toMillis?.() ?? 0)
          );

          setReviews(ownReviews);
          setReviewsLoading(false);
        },
        () => {
          setReviewsError('Couldn’t load your reviews. Reopen Profile to try again.');
          setReviewsLoading(false);
        }
      );
    }, [userId])
  );

  async function submitAccount() {
    if (actionInProgress.current) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setMessage('Enter your email and password.');
      return;
    }

    if (registering && !displayName.trim()) {
      setMessage('Enter a display name.');
      return;
    }

    if (registering && password !== confirmPassword) {
      setMessage('Your passwords do not match.');
      return;
    }

    actionInProgress.current = true;
    setBusy(true);
    setMessage('');

    try {
      if (registering) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        // Account creation signs the user in automatically.
        // If saving the name fails, they can retry it from Profile.
        try {
          const name = displayName.trim();
          await updateProfile(credential.user, { displayName: name });

          setDisplayName(name);
          setPublicName(name);
          setSavedDetails((current) =>
            current ? { ...current, displayName: name } : current
          );
          setMessage('Account created.');
        } catch {
          setMessage(
            'Account created. Enter and save your display name below to finish your profile.'
          );
        }
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }

      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      const errors = {
        'auth/email-already-in-use': 'An account already uses this email. Try signing in.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
        'auth/password-does-not-meet-requirements':
          'Choose a password that meets your Firebase password policy.',
        'auth/network-request-failed': 'Check your connection and try again.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };

      setMessage(
        errors[error.code] ??
          'Couldn’t complete sign-in. Check your details and try again.'
      );
    } finally {
      actionInProgress.current = false;
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (actionInProgress.current) return;

    if (!email.trim()) {
      setMessage('Enter your email above, then tap Forgot password.');
      return;
    }

    actionInProgress.current = true;
    setBusy(true);
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage(
        'If this email has an eligible account, you’ll receive a password reset link. Check your inbox and spam folder.'
      );
    } catch {
      setMessage('Couldn’t request a reset. Check your email and connection.');
    } finally {
      actionInProgress.current = false;
      setBusy(false);
    }
  }

  async function saveProfile() {
    if (actionInProgress.current || !savedDetails) return;

    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) return;

    const details = {
      displayName: displayName.trim(),
      fullName: fullName.trim(),
      city: city.trim(),
    };

    if (!details.displayName) {
      setMessage('Enter a display name before saving.');
      return;
    }

    actionInProgress.current = true;
    setBusy(true);
    setMessage('');

    try {
      // Save private fields first, then the Authentication display name.
      await setDoc(doc(db, 'users', currentUser.uid), {
        fullName: details.fullName,
        city: details.city,
      });

      setSavedDetails((current) => ({
        ...current,
        fullName: details.fullName,
        city: details.city,
      }));

      await updateProfile(currentUser, {
        displayName: details.displayName,
      });

      setSavedDetails(details);
      setPublicName(details.displayName);
      setDisplayName(details.displayName);
      setFullName(details.fullName);
      setCity(details.city);
      setMessage('Profile saved.');
    } catch {
      setMessage(
        'Couldn’t finish saving your profile. Some fields may have saved. Please try Save profile again.'
      );
    } finally {
      actionInProgress.current = false;
      setBusy(false);
    }
  }

  function cancelProfileChanges() {
    if (!savedDetails) return;

    setDisplayName(savedDetails.displayName);
    setFullName(savedDetails.fullName);
    setCity(savedDetails.city);
    setMessage('');
  }

  async function handleSignOut() {
  if (actionInProgress.current) return;

  actionInProgress.current = true;
  setBusy(true);
  setMessage('');

  try {
    await signOut(auth);

    // Return to Login after Firebase finishes signing out.
  } catch {
    setMessage('Couldn’t sign out. Please try again.');
  } finally {
    actionInProgress.current = false;
    setBusy(false);
  }
}
 

  function confirmDelete(review) {
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
            setEditingReviewId((current) =>
              current === review.id ? null : current
            );
          } catch {
            Alert.alert('Couldn’t delete your review', 'Please try again.');
          } finally {
            deletingReview.current = false;
          }
        },
      },
    ]);
  }

  function switchAccountMode() {
    setRegistering((current) => !current);
    setPassword('');
    setConfirmPassword('');
    setMessage('');
  }

  return (
    <SafeAreaView style={screenStyles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.scrollContent}
      >
        {checkingSession ? (
          <View style={screenStyles.content}>
            <Text style={screenStyles.body}>Checking sign-in status…</Text>
          </View>
        ) : user ? (
          <ScreenHeader
            title="Profile"
            description="Your details, your reviews and the places you’ve saved."
          />
        ) : (
          // Match the large blue logo panel from your login reference.
          <View style={styles.logoPanel}>
            <Image
              source={require('../../../assets/images/Securie-logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessible={false}
            />
          </View>
        )}

        <View style={screenStyles.content}>
          {!checkingSession && !user ? (
            <View style={screenStyles.card}>
              <Text accessibilityRole="header" style={screenStyles.cardTitle}>
                {registering ? 'Create account' : 'Login'}
              </Text>

              {registering ? (
                <>
                  <Text style={screenStyles.label}>Display name</Text>
                  <TextInput
                    accessibilityLabel="Display name"
                    style={screenStyles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    maxLength={50}
                    editable={!busy}
                    autoComplete="nickname"
                  />
                </>
              ) : null}

              <Text style={screenStyles.label}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                placeholder="Enter email"
                placeholderTextColor={colours.textSecondary}
                style={screenStyles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!busy}
              />

              <Text style={screenStyles.label}>Password</Text>
              <TextInput
                accessibilityLabel="Password"
                placeholder={registering ? 'At least 6 characters' : 'Enter password'}
                placeholderTextColor={colours.textSecondary}
                style={screenStyles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={registering ? 'new-password' : 'current-password'}
                editable={!busy}
              />

              {registering ? (
                <>
                  <Text style={screenStyles.label}>Confirm password</Text>
                  <TextInput
                    accessibilityLabel="Confirm password"
                    style={screenStyles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    editable={!busy}
                  />
                </>
              ) : (
                <AppButton
                  label="Forgot password?"
                  variant="outline"
                  disabled={busy}
                  onPress={resetPassword}
                />
              )}

              <AppButton
                label={
                  busy
                    ? 'Please wait…'
                    : registering
                      ? 'Create account'
                      : 'Login'
                }
                disabled={busy}
                onPress={submitAccount}
              />

              <AppButton
                label={
                  registering
                    ? 'Already have an account? Login'
                    : 'New to Securie? Create account'
                }
                variant="outline"
                disabled={busy}
                onPress={switchAccountMode}
              />

              <Text style={screenStyles.supporting}>
                You can browse the Map and Help without an account.
              </Text>
            </View>
          ) : null}

          {user ? (
            <>
              {/* Show account totals above the editable white profile card. */}
              <View style={styles.identity}>
                <View style={styles.avatar}>
                  <Text style={styles.initial}>
                    {(publicName.trim()[0] ?? 'S').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.identityText}>
                  <Text style={screenStyles.label}>
                    {publicName || 'Your profile'}
                  </Text>
                  <Text style={screenStyles.supporting}>
                    {reviewsLoading || reviewsError ? 'Reviews' : `${reviews.length} reviews`}
                    {' · '}
                    {favouritesLoading || favouritesLoadError
                      ? 'Favourites'
                      : `${favouritePlaces.length} favourites`}
                  </Text>
                </View>
              </View>

              <View style={screenStyles.card}>
                <Text accessibilityRole="header" style={screenStyles.label}>
                  Edit profile information
                </Text>

                {profileLoading ? (
                  <Text style={screenStyles.body}>Loading profile…</Text>
                ) : profileError ? (
                  <Text style={screenStyles.notice}>{profileError}</Text>
                ) : (
                  <>
                    <Text style={screenStyles.label}>Full name (optional)</Text>
                    <TextInput
                      accessibilityLabel="Full name, optional"
                      style={screenStyles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      maxLength={100}
                      editable={!busy}
                    />

                    <Text style={screenStyles.label}>Display name</Text>
                    <TextInput
                      accessibilityLabel="Display name"
                      style={screenStyles.input}
                      value={displayName}
                      onChangeText={setDisplayName}
                      maxLength={50}
                      editable={!busy}
                    />

                    <Text style={screenStyles.label}>Email address</Text>
                    <TextInput
                      accessibilityLabel="Email address, read only"
                      style={[screenStyles.input, styles.readOnly]}
                      value={user.email ?? ''}
                      editable={false}
                    />

                    <Text style={screenStyles.label}>City (optional)</Text>
                    <TextInput
                      accessibilityLabel="City, optional"
                      style={screenStyles.input}
                      value={city}
                      onChangeText={setCity}
                      maxLength={100}
                      editable={!busy}
                    />

                    <Text style={screenStyles.supporting}>
                      Your full name, email and city are kept in your account.
                    </Text>

                    <AppButton
                      label={busy ? 'Please wait…' : 'Save profile'}
                      onPress={saveProfile}
                      disabled={busy || !savedDetails}
                    />
                    <AppButton
                      label="Cancel changes"
                      variant="outline"
                      onPress={cancelProfileChanges}
                      disabled={busy || !savedDetails}
                    />
                  </>
                )}
              </View>

              <AppButton
                label={busy ? 'Please wait…' : 'Sign out'}
                variant="outline"
                disabled={busy}
                onPress={handleSignOut}
              />
            </>
          ) : null}

          {message ? (
            <Text accessibilityRole="alert" style={screenStyles.notice}>
              {message}
            </Text>
          ) : null}

          {user ? (
            <>
              <Text accessibilityRole="header" style={screenStyles.sectionTitle}>
                My reviews{!reviewsLoading && !reviewsError ? ` · ${reviews.length}` : ''}
              </Text>

              {reviewsLoading ? (
                <Text style={screenStyles.body}>Loading your reviews…</Text>
              ) : reviewsError ? (
                <Text style={screenStyles.notice}>{reviewsError}</Text>
              ) : reviews.length === 0 ? (
                <View style={screenStyles.card}>
                  <Text style={screenStyles.body}>
                    No reviews yet. Choose a place from the Map to leave one.
                  </Text>
                </View>
              ) : (
                reviews.map((review) => {
                  const place = places.find((item) => item.id === review.placeId);
                  const date = reviewDate(review.createdAt);

                  return (
                    <View key={review.id} style={screenStyles.card}>
                      <Text style={screenStyles.sectionTitle}>
                        {place?.name ?? 'Location'}
                      </Text>
                      {date ? (
                        <Text style={screenStyles.supporting}>{date}</Text>
                      ) : null}

                      {editingReviewId === review.id ? (
                        <>
                          <ReviewForm
                            key={review.id}
                            placeId={review.placeId}
                            review={review}
                            onSaved={() => setEditingReviewId(null)}
                          />
                          <AppButton
                            label="Cancel edit"
                            variant="outline"
                            onPress={() => setEditingReviewId(null)}
                          />
                        </>
                      ) : (
                        <>
                          <Text style={screenStyles.label}>
                            {review.rating} out of 5 stars
                          </Text>
                          <Text style={screenStyles.body}>{review.comment}</Text>
                          <AppButton
                            label="Edit review"
                            variant="outline"
                            onPress={() => setEditingReviewId(review.id)}
                          />
                          <AppButton
                            label="Delete review"
                            variant="outline"
                            onPress={() => confirmDelete(review)}
                          />
                        </>
                      )}
                    </View>
                  );
                })
              )}
            </>
          ) : null}

          {/* Favourites stay accessible when browsing as a guest. */}
          <Text accessibilityRole="header" style={screenStyles.sectionTitle}>
            My favourites
            {!favouritesLoading && !favouritesLoadError
              ? ` · ${favouritePlaces.length}`
              : ''}
          </Text>

          {favouritesLoading ? (
            <Text style={screenStyles.body}>Loading favourites…</Text>
          ) : favouritesLoadError ? (
            <Text style={screenStyles.notice}>{favouritesLoadError}</Text>
          ) : favouritePlaces.length === 0 ? (
            <View style={screenStyles.card}>
              <Text style={screenStyles.body}>
                Save a place from the Map to see it here.
              </Text>
            </View>
          ) : (
            favouritePlaces.map((place) => (
              <View key={place.id} style={screenStyles.card}>
                <Text style={screenStyles.cardTitle}>{place.name}</Text>
                <Text style={screenStyles.supporting}>Dundee</Text>
                <AppButton
                  label={favouritesSaving ? 'Updating…' : 'Remove favourite'}
                  variant="outline"
                  disabled={favouritesSaving}
                  onPress={() => toggleFavourite(place.id)}
                />
              </View>
            ))
          )}

          {favouritesSaveError ? (
            <Text style={screenStyles.notice}>{favouritesSaveError}</Text>
          ) : null}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 96,
  },
  // Scale the blue logo panel for a phone screen.
  logoPanel: {
    minHeight: 230,
    backgroundColor: colours.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  logo: {
    width: 280,
    height: 220,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  identityText: {
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.text,
  },
  initial: {
    color: colours.white,
    fontSize: 20,
    fontWeight: '700',
  },
  readOnly: {
    backgroundColor: colours.background,
  },
});