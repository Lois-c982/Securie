# Securie

Securie is a Dundee-focused women’s safety mobile app built with React Native and Expo. It combines searchable place information, community reviews and tools for accessing support and sharing a location.

## Requirements

- Node.js [insert the version used for testing].
- npm.
- Expo Go compatible with the project’s Expo SDK, or a compatible development build.
- A physical phone for testing SMS.
- Internet access for Firebase features and background map loading.

Tested on a iphone 15 and 16

## Installation

Clone the repository:

```bash
git clone [repository URL]
cd [repository folder]
```

Install the dependencies:

```bash
npm ci
```

Start Expo:

```bash
npx expo start
```

Open the project in a compatible Expo Go app or development build using the instructions displayed in the terminal.


## Firebase Setup

Firebase configuration is located in:

```text
src/lib/firebase.js
```

For assessment, [explain whether the submitted configuration connects to your maintained project or whether the assessor must configure their own].

To use a separate Firebase project:

1. Create a Firebase project.
2. Enable Email/Password authentication.
3. Create a Cloud Firestore database.
4. Update the Firebase configuration in `src/lib/firebase.js`.
5. Publish the rules supplied in `firestore.rules`.



## Permissions

Location permission is requested when the user selects a location-dependent feature.

Trusted contacts are entered manually; the app does not request access to the device’s address book.

SMS availability depends on the device. It is unavailable in the iOS simulator and browser.


## Data Sources

The bundled dataset contains two original locations and 17 OpenStreetMap-derived entries.

© OpenStreetMap contributors. OpenStreetMap-derived data is available under the Open Database Licence.

- https://www.openstreetmap.org/copyright
- https://opendatacommons.org/licenses/odbl/1-0/

See `DATA-SOURCES.md` for the dataset’s provenance and limitations.

