import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/app-button';
import { colours } from '@/constants/theme';
import { auth } from '@/lib/firebase';

export default function LoginScreen() {
  const router = useRouter();

  const [registering, setRegistering] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [savedUser, setSavedUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Prevent repeated button taps from starting duplicate requests.
  const requestInProgress = useRef(false);

  // Wait for Firebase to restore any account saved on this device.
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setSavedUser(user);
      setCheckingSession(false);
    });
  }, []);

  async function submitAccount() {
    if (requestInProgress.current) return;

    const cleanEmail = email.trim();
    const cleanName = displayName.trim();

    if (!cleanEmail || !password) {
      setMessage('Enter your email and password.');
      return;
    }

    if (registering && !cleanName) {
      setMessage('Enter a display name.');
      return;
    }

    if (registering && password !== confirmPassword) {
      setMessage('Your passwords do not match.');
      return;
    }

    requestInProgress.current = true;
    setBusy(true);
    setMessage('');

    try {
      if (registering) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        // Registration signs the user in automatically.
        try {
          await updateProfile(credential.user, {
            displayName: cleanName,
          });
        } catch {
          setPassword('');
          setConfirmPassword('');
          setMessage(
            'Account created. Continue with your saved account, then save your display name from Profile.'
          );
          return;
        }
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }

      setPassword('');
      setConfirmPassword('');
      router.replace('/(tabs)');
    } catch (error) {
      const messages = {
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/email-already-in-use':
          'This email already has an account. Try logging in.',
        'auth/weak-password':
          'Choose a stronger password with at least 6 characters.',
        'auth/password-does-not-meet-requirements':
          'Choose a password that meets the account password requirements.',
        'auth/network-request-failed':
          'Check your internet connection and try again.',
        'auth/too-many-requests':
          'Too many attempts. Please try again later.',
      };

      setMessage(
        messages[error.code] ??
          'Couldn’t complete login. Check your details and try again.'
      );
    } finally {
      requestInProgress.current = false;
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (requestInProgress.current) return;

    if (!email.trim()) {
      setMessage('Enter your email first, then tap Forgot password.');
      return;
    }

    requestInProgress.current = true;
    setBusy(true);
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage(
        'If this email has an eligible account, you’ll receive a reset link. Check your inbox and spam folder.'
      );
    } catch {
      setMessage('Couldn’t request a reset. Check your email and connection.');
    } finally {
      requestInProgress.current = false;
      setBusy(false);
    }
  }

  function switchMode() {
    setRegistering((current) => !current);
    setPassword('');
    setConfirmPassword('');
    setMessage('');
  }

  async function continueAsGuest() {
    if (requestInProgress.current) return;

    requestInProgress.current = true;
    setBusy(true);
    setMessage('');

    try {
      // Clear the saved account before opening the app as a guest.
      await signOut(auth);
      router.replace('/(tabs)');
    } catch {
      setMessage('Couldn’t continue as guest. Please try again.');
    } finally {
      requestInProgress.current = false;
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Blue logo panel from your login design. */}
        <View style={styles.logoPanel}>
          <Image
            source={require('../../assets/images/Securie-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Securie, Dundee Women’s Safety"
          />
        </View>

        <View style={styles.formArea}>
          <View style={styles.formCard}>
            {registering ? (
              <>
                <Text accessibilityRole="header" style={styles.title}>
                  Create account
                </Text>

                <Text style={styles.label}>Display name</Text>
                <TextInput
                  accessibilityLabel="Display name"
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  maxLength={50}
                  editable={!busy}
                  autoComplete="nickname"
                />
              </>
            ) : null}

            <Text style={styles.label}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              placeholder="Enter email"
              placeholderTextColor={colours.textSecondary}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              editable={!busy}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              accessibilityLabel="Password"
              placeholder={
                registering ? 'At least 6 characters' : 'Enter password'
              }
              placeholderTextColor={colours.textSecondary}
              style={styles.input}
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
                <Text style={styles.label}>Confirm password</Text>
                <TextInput
                  accessibilityLabel="Confirm password"
                  style={styles.input}
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
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={resetPassword}
                style={styles.forgotButton}
              >
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
            )}

            {message ? (
              <Text accessibilityRole="alert" style={styles.message}>
                {message}
              </Text>
            ) : null}

            <AppButton
              label={
                busy ? 'Please wait…' : registering ? 'Create account' : 'Login'
              }
              onPress={submitAccount}
              disabled={busy || checkingSession}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={switchMode}
            style={styles.textButton}
          >
            <Text style={styles.footerLink}>
              {registering
                ? 'Already have an account? Login'
                : 'New to Securie? Create account'}
            </Text>
          </Pressable>

          <AppButton
            label="Continue as guest"
            variant="outline"
            disabled={busy || checkingSession}
            onPress={continueAsGuest}
          />

          {savedUser ? (
            <AppButton
              label="Continue with your saved account"
              variant="secondary"
              disabled={busy}
              onPress={() => router.replace('/(tabs)')}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Keep the blue logo panel above the white login form.
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colours.header,
  },
  page: {
    flexGrow: 1,
  },
  // Keep the logo prominent on the login screen.
  logoPanel: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.softBlue,
    padding: 24,
  },

  logo: {
    width: 300,
    height: 260,
    maxWidth: '100%',
  },
  formArea: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 18,
    gap: 10,
  },
  formCard: {
    backgroundColor: colours.white,
    borderRadius: 8,
    padding: 18,
    gap: 12,
  },
  title: {
    color: colours.text,
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    color: colours.text,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 6,
    backgroundColor: colours.white,
    color: colours.text,
    fontSize: 16,
  },
  forgotButton: {
    minHeight: 44,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    marginBottom: 12,
  },
  link: {
    color: colours.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    color: colours.text,
    fontSize: 15,
    lineHeight: 21,
  },
  textButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLink: {
    color: colours.text,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
});