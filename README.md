# Waypoint: Sorsogon Tourism App

Waypoint is a cross-platform mobile application designed to promote and streamline tourism in the province of Sorsogon.

## Features
- **Centralized Directory:** Categorized Sorsogon destinations.
- **Real-time Interaction:** Live-syncing favorite lists and community reviews via Firebase Firestore.
- **Personalized Profile:** Custom name and avatar management.
- **Offline Capabilities:** Localized data persistence for core features.

## Architecture
- **Framework:** React Native + Expo
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth (Email/Password)
- **Folder Structure:**
  - `screens/`: UI components for all views.
  - `services/`: Firebase configuration and Firestore queries.
  - `components/`: Reusable UI elements.

## Firebase Configuration
This project uses environment variables for security. To run this locally:
1. Create a `.env` file in the root directory.
2. Add your Firebase keys:
   `EXPO_PUBLIC_FIREBASE_API_KEY=your_key_here`
   ... (add all other keys as configured in your firebaseConfig.js)

## Security Rules Summary
- **Public:** Users can read destination and review data.
- **Authenticated:** Only logged-in users can write reviews or save favorites.
- **Private:** Users can only modify their own profile data (`request.auth.uid == userId`).

## Testing Evidence
The application has passed 10+ manual test cases covering authentication, Firestore CRUD, and UI responsiveness. See the Final Term Paper for the full testing table.