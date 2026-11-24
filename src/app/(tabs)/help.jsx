//this screen provides emergency help, trusted contacts, and local support. It also includes a simulated call feature for practice or demonstration purposes.
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/app-button';
import ScreenHeader from '@/components/screen-header';
import SimulatedCall from '@/components/simulated-call';
import TrustedContacts from '@/components/trusted-contacts';
import { screenStyles } from '@/constants/screen-styles';

// I bundle these details so they can be read offline.
const emergencyContact = {
  title: 'Emergency help',
  number: '999',
  description:
    'Use this if someone is in immediate danger or needs help now.',
};

const supportContacts = [
  {
    title: 'Police Scotland',
    number: '101',
    description:
      'Report a crime or contact the police about a non-emergency.',
  },
  {
    title: 'Dundee Women’s Aid',
    number: '01382 207099',
    description:
      'Local support if you’re experiencing domestic abuse.',
    hours:
      'Monday to Friday, 9:30 am–12:30 pm and 1:30 pm–4:30 pm.',
  },
];

//this function opens the phone dialer with the given number.
//  It removes any non-digit characters from the number before opening the dialer. 
// If the dialer cannot be opened, it shows an alert with instructions to manually enter the number.
async function openPhone(number) {
  const digits = number.replace(/\D/g, '');

  try {
    await Linking.openURL(`tel:${digits}`);
  } catch {
    Alert.alert(
      'Couldn’t open the Phone app',
      `Open the Phone app and enter ${number}.`
    );
  }
}

//this component renders a card for a contact, including the title, description, 
// hours (if provided), and a button to call the contact.
function ContactCard({ contact, primary = false }) {
  return (
    <View style={screenStyles.card}>
      <Text
        accessibilityRole="header"
        style={screenStyles.cardTitle}
      >
        {contact.title}
      </Text>

      <Text style={screenStyles.body}>
        {contact.description}
      </Text>

      {contact.hours ? (
        <Text style={screenStyles.supporting}>
          {contact.hours}
        </Text>
      ) : null}

      <AppButton
        label={`Call ${contact.number}`}
        accessibilityLabel={`Call ${contact.title}, ${contact.number}`}
        accessibilityHint="Opens your device’s phone dialler."
        variant={primary ? 'primary' : 'outline'}
        onPress={() => openPhone(contact.number)}
      />
    </View>
  );
}

export default function HelpScreen() {
  const [showSimulatedCall, setShowSimulatedCall] =
    useState(false);

  // I keep this callback stable for the audio component.
  const closeSimulatedCall = useCallback(() => {
    setShowSimulatedCall(false);
  }, []);

  return (
    <SafeAreaView
      style={screenStyles.screen}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <ScreenHeader
          title="Help"
          description="Find emergency help, trusted contacts and local support."
        />

        <View style={screenStyles.content}>
          {/* I keep emergency help at the top. */}
          <ContactCard
            contact={emergencyContact}
            primary
          />

          {/* I keep contact management in its own component. */}
          <TrustedContacts />

          <View style={screenStyles.card}>
            <Text
              accessibilityRole="header"
              style={screenStyles.cardTitle}
            >
              Simulated call
            </Text>

            <Text style={screenStyles.body}>
              Open a simulated incoming call and play a
              prerecorded voice.
            </Text>

            <Text style={screenStyles.supporting}>
              This does not make a real phone call or
              contact anyone.
            </Text>

            <AppButton
              label="Start simulated call"
              variant="secondary"
              accessibilityHint="Opens a simulated call screen. No real call is made."
              onPress={() => setShowSimulatedCall(true)}
            />
          </View>

          <Text
            accessibilityRole="header"
            style={screenStyles.sectionTitle}
          >
            Important numbers
          </Text>

          {supportContacts.map((contact) => (
            <ContactCard
              key={contact.number}
              contact={contact}
            />
          ))}
        </View>
      </ScrollView>

     {/*mounts the audio component only while it is needed. */} 
      {showSimulatedCall ? (
        <SimulatedCall onClose={closeSimulatedCall} />
      ) : null}
    </SafeAreaView>
  );
}