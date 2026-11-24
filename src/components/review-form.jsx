import AppButton from '@/components/app-button';
import { screenStyles } from '@/constants/screen-styles';
import { colours } from '@/constants/theme';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ReviewForm({ placeId, review, onSaved }) {
  const [user, setUser] = useState(undefined);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [comment, setComment] = useState(review?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const saveInProgress = useRef(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function submitReview() {
    if (saveInProgress.current || !user) return;

    const cleanComment = comment.trim();
    if (!rating || !cleanComment) {
      setMessage('Choose a star rating and enter a comment.');
      return;
    }

    // Block repeated taps while Firestore is saving.
    saveInProgress.current = true;
    setSaving(true);
    setMessage('');

    try {
      if (review) {
        await updateDoc(doc(db, 'reviews', review.id), {
          rating,
          comment: cleanComment,
        });
      } else {
        await addDoc(collection(db, 'reviews'), {
          placeId,
          userId: user.uid,
          rating,
          comment: cleanComment,
          createdAt: serverTimestamp(),
        });
      }

      setRating(0);
      setComment('');
      setMessage('Review saved.');
      onSaved();
    } catch (error) {
      console.warn('Could not save review:', error.code);
      setMessage('Couldn’t save your review. Please try again.');
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  }

  if (user === undefined) {
    return <Text style={screenStyles.supporting}>Checking sign-in status…</Text>;
  }

  if (!user) {
    return <Text style={screenStyles.supporting}>Sign in from Profile to leave a review.</Text>;
  }

  return (
    <View style={styles.form}>
      <Text accessibilityRole="header" style={screenStyles.label}>
        How safe did you feel here?
      </Text>

      <View style={styles.ratings}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`${value} out of 5 stars`}
            accessibilityState={{ selected: rating === value, disabled: saving }}
            disabled={saving}
            onPress={() => setRating(value)}
            style={[styles.rating, rating === value && styles.selected]}
          >
            <Text style={[screenStyles.body, rating === value && styles.selectedLabel]}>
              {value} ★
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={screenStyles.label}>Comment</Text>
      <TextInput
        accessibilityLabel="Review comment"
        style={[screenStyles.input, styles.commentInput]}
        value={comment}
        onChangeText={setComment}
        editable={!saving}
        maxLength={500}
        multiline
      />

      <AppButton
        label={saving ? 'Saving review…' : review ? 'Save changes' : 'Submit review'}
        onPress={submitReview}
        disabled={saving}
      />

      {message ? (
        <Text accessibilityRole="alert" style={screenStyles.notice}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 8, backgroundColor: colours.background, padding: 12, borderRadius: 8 },
  ratings: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rating: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.white,
    borderRadius: 8,
  },
  // Bold text supplements the blue fill when a rating is selected.
  selected: { backgroundColor: colours.softBlue, borderColor: colours.blueBorder },
  selectedLabel: { fontWeight: '800' },
  commentInput: { minHeight: 76, textAlignVertical: 'top' },
});