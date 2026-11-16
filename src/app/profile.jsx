import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/app-button';
import { auth } from '@/lib/firebase';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingSession(false);
    });
  }, []);

  async function handleSignIn() {
    if (busy) return;
    if (!email.trim() || !password) {
      setMessage('Enter your email and password.');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    } catch (error) {
      setMessage(
        error.code === 'auth/network-request-failed'
          ? 'Check your internet connection and try again.'
          : 'Couldn’t sign in. Check your email and password and try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (busy) return;

    setBusy(true);
    setMessage('');

    try {
      await signOut(auth);
    } catch {
      setMessage('Couldn’t sign out. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text accessibilityRole="header" style={styles.heading}>Profile</Text>

        {checkingSession ? (
          <Text>Checking sign-in status…</Text>
        ) : user ? (
          <>
            <Text>Signed in as {user.email}</Text>
            <AppButton
              label={busy ? 'Signing out…' : 'Sign out'}
              onPress={handleSignOut}
            />
          </>
        ) : (
          <>
            <Text>You can browse reviews as a guest.</Text>

            <Text>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
            />

            <Text>Password</Text>
            <TextInput
              accessibilityLabel="Password"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />

            <AppButton
              label={busy ? 'Signing in…' : 'Sign in'}
              onPress={handleSignIn}
            />
          </>
        )}

        {message ? <Text accessibilityRole="alert">{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, gap: 12 },
  heading: { fontSize: 28, fontWeight: '700' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 8,
    padding: 12,
    color: '#222',
  },
});