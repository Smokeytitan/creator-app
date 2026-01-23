# Content Requests Mobile App

React Native mobile application for the Content Requests platform.

## Project Structure

```
mobile/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable UI components
│   │   ├── common/      # Shared components
│   │   ├── forms/       # Form components
│   │   └── ui/          # UI elements
│   ├── navigation/      # Navigation setup
│   ├── services/        # API and business logic
│   ├── store/           # State management
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utility functions
│   └── assets/          # Images, fonts, etc.
├── ios/                 # iOS native code
├── android/             # Android native code
└── __tests__/           # Test suites
```

## Getting Started

### Prerequisites

- Node.js 18+
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

```bash
cd mobile
npm install

# iOS
cd ios && pod install && cd ..

# Android
# Open android/ folder in Android Studio and sync
```

### Running the App

```bash
# iOS
npm run ios

# Android
npm run android
```

## Development

### Key Features

- Creator roster management
- Content request tracking
- Kaito leaderboard integration
- Real-time analytics
- Offline support

### Architecture

- **Pattern**: MVVM with Clean Architecture
- **State Management**: Redux Toolkit with RTK Query
- **Navigation**: React Navigation v6
- **Styling**: Styled Components with Polygon brand system
- **Testing**: Jest + React Native Testing Library + Detox E2E

### Platform-Specific Features

**iOS:**
- Face ID/Touch ID authentication
- Native share sheet integration
- Siri shortcuts support

**Android:**
- Material Design 3
- Dynamic shortcuts
- Android Auto Backup

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (iOS)
npm run test:e2e:ios

# E2E tests (Android)
npm run test:e2e:android
```

## Deployment

### iOS (TestFlight)

```bash
npm run build:ios
fastlane ios beta
```

### Android (Internal Testing)

```bash
npm run build:android
fastlane android beta
```

## Performance Optimization

- Hermes engine enabled
- Native animations via react-native-reanimated
- Image optimization with FastImage
- FlatList optimization for large lists
- Intelligent caching strategies

## Security

- AES-256 encryption for local data
- Certificate pinning for API calls
- Secure storage for sensitive data
- Jailbreak/root detection

## Documentation

See [MOBILE.md](../.devtools/MOBILE.md) for comprehensive mobile development patterns and best practices.

## Support

For issues and questions, see the main project README.
