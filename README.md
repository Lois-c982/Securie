# Securie

Securie is a Dundee-focused women’s safety mobile app built with React Native and Expo. It combines searchable place information, community reviews and tools for accessing support and sharing a location.

## Requirements

- Node.js v25.8.1.
- npm.
- Expo Go compatible with the project’s Expo SDK, or a compatible development build.
- A physical phone for testing SMS.
- Internet access for Firebase features and background map loading.

Tested on a iphone 15 and 16

## Installation

Clone the repository:

```bash
git clone [https://github.com/Lois-c982/Securie]
cd securie
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
src/lib/firebase.js

The app is configured to connect to my existing Firebase project. You can register an account through the app to test authenticated features. An internet connection is required.


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

