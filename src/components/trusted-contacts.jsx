import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    AppState,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import AppButton from '@/components/app-button';
import { screenStyles } from '@/constants/screen-styles';
import { colours } from '@/constants/theme';
import { auth } from '@/lib/firebase';

// I process storage operations in order so account switching
// does not load an old list while a save is still finishing.
let storageQueue = Promise.resolve();

function queueStorage(work) {
  const result = storageQueue.then(work);
  storageQueue = result.catch(() => {});
  return result;
}

// I allow ordinary phone-number formatting.
// This checks the format, not whether the number exists.
function cleanNumber(value) {
  const number = value.replace(/[\s().-]/g, '');

  return /^\+?[0-9]{7,15}$/.test(number)
    ? number
    : null;
}

export default function TrustedContacts() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setSession({ uid: user?.uid ?? null });
    });
  }, []);

  if (!session) {
    return (
      <View style={screenStyles.card}>
        <Text style={screenStyles.body}>
          Checking sign-in status…
        </Text>
      </View>
    );
  }

  // I require sign-in before displaying contacts or allowing
  // location sharing through this feature.
  if (session.uid === null) {
    return (
      <View style={screenStyles.card}>
        <Text
          accessibilityRole="header"
          style={screenStyles.cardTitle}
        >
          Trusted contacts
        </Text>

        <Text style={screenStyles.body}>
          Sign in from Profile to manage trusted contacts
          and share your location by text.
        </Text>

        <Text style={screenStyles.supporting}>
          Emergency numbers and the simulated call are
          still available without signing in.
        </Text>
      </View>
    );
  }

  // I remount the form when the account changes, removing
  // the previous account's displayed contacts and edits.
  return (
    <ContactList
      key={`user:${session.uid}`}
      uid={session.uid}
    />
  );
}

function ContactList({ uid }) {
  // I give each signed-in account a separate storage key.
  const key =
    `securie:trusted-contacts:v1:user:${encodeURIComponent(uid)}`;

  const alive = useRef(false);
  const working = useRef(false);

  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  function isCurrent() {
    // I check the active account before saves and after
    // asynchronous requests, including location retrieval.
    return (
      alive.current &&
      uid !== null &&
      auth.currentUser !== null &&
      auth.currentUser.uid === uid
    );
  }

  useEffect(() => {
    let active = true;
    alive.current = true;

    async function load() {
      try {
        const stored = await queueStorage(() =>
          AsyncStorage.getItem(key)
        );

        const list =
          stored === null ? [] : JSON.parse(stored);

        // I validate saved data before displaying or changing it.
        if (
          !Array.isArray(list) ||
          list.length > 10 ||
          list.some(
            (contact) =>
              !contact ||
              typeof contact.id !== 'string' ||
              !contact.id ||
              typeof contact.name !== 'string' ||
              !contact.name.trim() ||
              contact.name.length > 50 ||
              typeof contact.phone !== 'string' ||
              !cleanNumber(contact.phone)
          ) ||
          new Set(list.map((contact) => contact.id)).size !==
            list.length
        ) {
          throw new Error('Invalid contacts');
        }

        if (
          active &&
          auth.currentUser?.uid === uid
        ) {
          setContacts(list);
        }
      } catch {
        if (active) {
          setLoadError(true);
          setMessage(
            'Couldn’t load contacts. Restart the app to try again.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
      alive.current = false;
    };
  }, [key, uid]);

  function clearForm() {
    setName('');
    setPhone('');
    setEditing(null);
  }

  async function persist(next) {
    if (
      !isCurrent() ||
      working.current ||
      loading ||
      loadError
    ) {
      return;
    }

    working.current = true;
    setBusy(true);
    setMessage('');

    try {
      await queueStorage(() => {
        // I check again in case the account changed while
        // this operation was waiting in the storage queue.
        if (!isCurrent()) {
          throw new Error('Account changed');
        }

        return AsyncStorage.setItem(
          key,
          JSON.stringify(next)
        );
      });

      if (isCurrent()) {
        setContacts(next);
        clearForm();
        setMessage('Contacts updated.');
      }
    } catch {
      if (isCurrent()) {
        setMessage(
          'Couldn’t save contacts. Please try again.'
        );
      }
    } finally {
      working.current = false;

      if (isCurrent()) setBusy(false);
    }
  }

  function saveContact() {
    if (
      !isCurrent() ||
      working.current ||
      loading ||
      loadError
    ) {
      return;
    }

    const number = cleanNumber(phone);

    if (
      !name.trim() ||
      name.trim().length > 50 ||
      !number
    ) {
      setMessage(
        'Enter a name and a phone number with 7–15 digits. Use + and the country code for international numbers.'
      );
      return;
    }

    if (
      contacts.some(
        (contact) =>
          contact.id !== editing &&
          cleanNumber(contact.phone) === number
      )
    ) {
      setMessage(
        'That number is already in your trusted contacts.'
      );
      return;
    }

    if (!editing && contacts.length >= 10) {
      setMessage(
        'You can save up to 10 trusted contacts.'
      );
      return;
    }

    // This ID identifies a local contact; it is not
    // a password, token or security credential.
    const contact = {
      id:
        editing ||
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
      name: name.trim(),
      phone: number,
    };

    const next = editing
      ? contacts.map((item) =>
          item.id === editing ? contact : item
        )
      : [...contacts, contact];

    void persist(next);
  }

  function removeContact(contact) {
    if (!isCurrent() || working.current) return;

    // I ask before deleting to prevent accidental removal.
    Alert.alert(
      'Remove trusted contact?',
      `Remove ${contact.name} from your saved list?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void persist(
              contacts.filter(
                (item) => item.id !== contact.id
              )
            );
          },
        },
      ]
    );
  }

  async function shareLocation(contact) {
    if (
      !isCurrent() ||
      working.current ||
      loading ||
      loadError
    ) {
      return;
    }

    working.current = true;
    setBusy(true);
    setMessage('Preparing location text…');

    let timer;

    try {
      if (!(await SMS.isAvailableAsync())) {
        throw new Error(
          'Text messaging is unavailable on this device. Try this feature on a physical phone.'
        );
      }

      if (!isCurrent()) return;

      // I request location permission only when the user
      // chooses to share their location.
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!isCurrent()) return;

      if (!permission.granted) {
        throw new Error(
          'Location permission is off. You can enable it in your device settings.'
        );
      }

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!isCurrent()) return;

      if (!servicesEnabled) {
        throw new Error(
          'Turn on your device’s location services and try again.'
        );
      }

      // I request a fresh position instead of a cached one.
      // The timeout stops this flow waiting indefinitely.
      // A late location result never opens a message by itself.
      const position = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            reject(
              new Error(
                'Finding your location took too long. Please try again.'
              )
            );
          }, 20000);
        }),
      ]);

      clearTimeout(timer);

      // I do not continue if the user signed out or switched
      // accounts while location retrieval was running.
      if (!isCurrent()) return;

      if (AppState.currentState !== 'active') {
        throw new Error(
          'Return to Help and tap Share my location again.'
        );
      }

      const { latitude, longitude, accuracy } =
        position.coords;

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180
      ) {
        throw new Error(
          'Couldn’t get a valid location. Please try again.'
        );
      }

      const link =
        'https://www.google.com/maps/search/?api=1' +
        `&query=${latitude},${longitude}`;

      const accuracyText =
        Number.isFinite(accuracy) && accuracy > 0
          ? ` Approximate accuracy: ${Math.ceil(accuracy)} metres.`
          : '';

      const text =
        `Hi ${contact.name}, I’m sharing my location using Securie. ` +
        `Recorded at ${new Date(
          position.timestamp
        ).toLocaleString()}.` +
        accuracyText +
        `\n${link}` +
        '\nThis is a single location update, not live tracking.';

      // I open the phone's composer, rather than sending silently.
      // The user reviews the recipient and message and presses Send.
      const result = await SMS.sendSMSAsync(
        [contact.phone],
        text
      );

      if (isCurrent()) {
        setMessage(
          result.result === 'cancelled'
            ? 'Message cancelled. Securie cannot confirm delivery.'
            : 'Messaging finished. Securie cannot confirm delivery; check your messaging app.'
        );
      }
    } catch (error) {
      if (isCurrent()) {
        setMessage(
          error.message ||
            'Couldn’t prepare the text. Please try again.'
        );
      }
    } finally {
      clearTimeout(timer);
      working.current = false;

      if (isCurrent()) setBusy(false);
    }
  }

  const unavailable = loading || loadError || busy;

  return (
    <View style={screenStyles.card}>
      <Text
        accessibilityRole="header"
        style={screenStyles.cardTitle}
      >
        Trusted contacts
      </Text>

      <Text style={screenStyles.body}>
        Save someone you trust, then prepare a text with
        your current location.
      </Text>

      <Text style={screenStyles.supporting}>
        You review and send the text yourself. This shares
        one location, not live tracking. Normal messaging
        charges may apply.
      </Text>

      <Text style={screenStyles.supporting}>
        Contacts are saved for this account on this device
        only. They are stored locally without encryption.
      </Text>

      {loading ? (
        <Text style={screenStyles.supporting}>
          Loading contacts…
        </Text>
      ) : null}

      {!loading &&
      !loadError &&
      contacts.length === 0 ? (
        <Text style={screenStyles.supporting}>
          No trusted contacts yet.
        </Text>
      ) : null}

      {contacts.map((contact) => (
        <View
          key={contact.id}
          style={styles.contact}
        >
          <Text style={screenStyles.label}>
            {contact.name}
          </Text>

          <Text
            selectable
            style={screenStyles.body}
          >
            {contact.phone}
          </Text>

          <AppButton
            label={`Share my location with ${contact.name}`}
            variant="secondary"
            disabled={unavailable}
            onPress={() => shareLocation(contact)}
            accessibilityHint="Finds your location and opens a text for you to review and send."
          />

          <AppButton
            label={`Edit ${contact.name}`}
            variant="outline"
            disabled={unavailable}
            onPress={() => {
              if (!isCurrent()) return;

              setEditing(contact.id);
              setName(contact.name);
              setPhone(contact.phone);
              setMessage(
                'Edit this contact using the form below.'
              );
            }}
          />

          <AppButton
            label={`Remove ${contact.name}`}
            variant="outline"
            disabled={unavailable}
            onPress={() => removeContact(contact)}
          />
        </View>
      ))}

      <Text
        accessibilityRole="header"
        style={screenStyles.label}
      >
        {editing
          ? 'Edit trusted contact'
          : 'Add trusted contact'}
      </Text>

      <Text style={screenStyles.label}>
        Name
      </Text>

      <TextInput
        accessibilityLabel="Trusted contact name"
        style={screenStyles.input}
        value={name}
        onChangeText={setName}
        maxLength={50}
        editable={!unavailable}
        autoCapitalize="words"
      />

      <Text style={screenStyles.label}>
        Phone number
      </Text>

      <TextInput
        accessibilityLabel="Trusted contact phone number"
        style={screenStyles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={30}
        editable={!unavailable}
        placeholder="For example, +44…"
        placeholderTextColor={colours.textSecondary}
      />

      <AppButton
        label={
          editing
            ? 'Save contact changes'
            : 'Add contact'
        }
        disabled={unavailable}
        onPress={saveContact}
      />

      {editing ? (
        <AppButton
          label="Cancel editing"
          variant="outline"
          disabled={unavailable}
          onPress={clearForm}
        />
      ) : null}

      {busy ? (
        <Text
          accessibilityLiveRegion="polite"
          style={screenStyles.supporting}
        >
          Please wait…
        </Text>
      ) : null}

      {message ? (
        <Text
          accessibilityRole="alert"
          style={screenStyles.notice}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contact: {
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderColor: colours.border,
  },
});