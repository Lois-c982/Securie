import {
    setAudioModeAsync,
    useAudioPlayer,
    useAudioPlayerStatus,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import {
    AppState,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/app-button';
import { screenStyles } from '@/constants/screen-styles';
import { colours } from '@/constants/theme';

// Bundle your recording with the app so it can play offline.
const recording = require('../../assets/audio/simulated-call.m4a');

export default function SimulatedCall({ onClose }) {
  const player = useAudioPlayer(recording);
  const status = useAudioPlayerStatus(player);
  const sessionOpen = useRef(true);
  const startingPlayback = useRef(false);

  const [answered, setAnswered] = useState(false);
  const [message, setMessage] = useState('');

  function endCall() {
    // Stop the recording before closing the call screen.
    sessionOpen.current = false;
    player.pause();
    onClose();
  }

  useEffect(() => {
    sessionOpen.current = true;

    // End the simulation when the phone locks or the app loses focus.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && sessionOpen.current) {
        sessionOpen.current = false;
        player.pause();
        onClose();
      }
    });

    return () => {
      sessionOpen.current = false;
      subscription.remove();
    };
  }, [player, onClose]);

  async function answerCall() {
    if (startingPlayback.current || answered || !status.isLoaded) return;

    startingPlayback.current = true;
    setMessage('');

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });

      // Prevent playback if the screen closed while setup was running.
      if (!sessionOpen.current) return;

      player.play();
      setAnswered(true);
    } catch {
      if (sessionOpen.current) {
        setMessage('Couldn’t play the recording. Try answering again.');
      }
    } finally {
      startingPlayback.current = false;
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={endCall}>
      <SafeAreaView style={screenStyles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.caller}>
            <Text style={screenStyles.supporting}>Simulated call</Text>

            <Text accessibilityRole="header" style={styles.name}>
              Alex
            </Text>

            <Text style={screenStyles.body}>
              {status.didJustFinish
                ? 'Recording finished'
                : answered
                  ? 'Playing recording'
                  : 'Incoming simulated call'}
            </Text>
          </View>

          {!answered ? (
            <AppButton
              label={status.isLoaded ? 'Answer' : 'Loading recording…'}
              onPress={answerCall}
              disabled={!status.isLoaded}
            />
          ) : null}

         <AppButton label="End call" variant="outline" onPress={endCall} />

          {message ? (
            <Text accessibilityRole="alert" style={screenStyles.notice}>
              {message}
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  caller: {
    backgroundColor: colours.softBlue,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: colours.text,
    fontSize: 36,
    fontWeight: '800',
  },
});