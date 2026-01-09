# Mobile Development Guide

## Overview

This guide provides comprehensive patterns and best practices for mobile app development across iOS, Android, and React Native platforms. It emphasizes parallel development workflows and cross-platform optimization.

## Quick Reference

### Single Message - Cross-Platform Parallel Development

```javascript
[BatchTool]:
  // iOS Components (Parallel)
  - Write("ios/Components/HomeScreen.swift", iosHomeScreen)
  - Write("ios/Components/ProfileScreen.swift", iosProfileScreen)
  - Write("ios/Components/SettingsScreen.swift", iosSettingsScreen)
  - Write("ios/Components/NavigationController.swift", iosNavigation)

  // Android Components (Parallel)
  - Write("android/app/src/main/java/com/app/HomeActivity.kt", androidHome)
  - Write("android/app/src/main/java/com/app/ProfileActivity.kt", androidProfile)
  - Write("android/app/src/main/java/com/app/SettingsActivity.kt", androidSettings)
  - Write("android/app/src/main/java/com/app/MainActivity.kt", androidMain)

  // React Native Screens (Parallel)
  - Write("src/screens/HomeScreen.tsx", rnHomeScreen)
  - Write("src/screens/ProfileScreen.tsx", rnProfileScreen)
  - Write("src/screens/SettingsScreen.tsx", rnSettingsScreen)
  - Write("src/navigation/AppNavigator.tsx", rnNavigation)

  // Shared Services (Parallel)
  - Write("src/services/AuthService.ts", authService)
  - Write("src/services/ApiService.ts", apiService)
  - Write("src/services/StorageService.ts", storageService)

  // Tests (Parallel)
  - Write("__tests__/screens/HomeScreen.test.tsx", homeScreenTests)
  - Write("__tests__/services/AuthService.test.ts", authServiceTests)
  - Write("e2e/app.e2e.js", e2eTests)
```

## 🎯 Mobile Project Context

### Project Types

- **📱 Native iOS**: Swift + UIKit/SwiftUI
- **🤖 Native Android**: Kotlin/Java + Jetpack Compose/XML
- **⚛️ React Native**: TypeScript + React Native
- **🔄 Hybrid**: Ionic, Flutter, Xamarin
- **📊 Cross-Platform**: .NET MAUI, Unity

### Architecture Patterns

- **MVVM**: Model-View-ViewModel for data binding
- **Clean Architecture**: Use cases, repositories, data sources
- **Redux/MobX**: State management for complex apps
- **Repository Pattern**: Data layer abstraction
- **Dependency Injection**: Modular, testable architecture

## 🔧 Mobile Development Patterns

### Native iOS Development Standards

```
iOS/
├── App/                    // App configuration
├── Scenes/                 // Screen view controllers (parallel)
│   ├── Home/              // Home scene components
│   ├── Profile/           // Profile scene components
│   └── Settings/          // Settings scene components
├── Services/              // Business logic services (parallel)
│   ├── AuthService.swift
│   ├── NetworkService.swift
│   └── StorageService.swift
├── Models/                // Data models (parallel)
├── Views/                 // Reusable UI components (parallel)
├── Extensions/            // Swift extensions
├── Resources/             // Images, fonts, strings
└── Tests/                 // Unit and UI tests (parallel)
```

### Native Android Development Standards

```
android/
├── app/src/main/java/com/app/
│   ├── ui/                     // Activities and Fragments (parallel)
│   │   ├── home/              // Home screen components
│   │   ├── profile/           // Profile screen components
│   │   └── settings/          // Settings screen components
│   ├── data/                  // Data layer (parallel)
│   │   ├── repository/        // Repository implementations
│   │   ├── local/            // Local data sources
│   │   └── remote/           // Remote data sources
│   ├── domain/               // Business logic (parallel)
│   │   ├── usecase/          // Use cases
│   │   └── model/            // Domain models
│   ├── di/                   // Dependency injection
│   └── util/                 // Utility classes
├── app/src/test/             // Unit tests (parallel)
└── app/src/androidTest/      // Integration tests (parallel)
```

### React Native Development Standards

```
src/
├── screens/               // Screen components (parallel)
│   ├── HomeScreen.tsx
│   ├── ProfileScreen.tsx
│   └── SettingsScreen.tsx
├── components/            // Reusable components (parallel)
│   ├── common/           // Shared components
│   ├── forms/            // Form components
│   └── ui/               // UI elements
├── navigation/           // Navigation setup
├── services/             // API and business logic (parallel)
├── store/                // State management
├── hooks/                // Custom hooks (parallel)
├── utils/                // Utility functions
├── assets/               // Images, fonts, etc.
└── __tests__/            // Tests (parallel)
```

### Concurrent File Creation Pattern

```javascript
// Always create related files in parallel
[BatchTool]:
  // Create screen with navigation, styles, and tests
  - Write("src/screens/ProductScreen.tsx", screenComponent)
  - Write("src/screens/ProductScreen.styles.ts", screenStyles)
  - Write("__tests__/screens/ProductScreen.test.tsx", screenTests)
  - Write("src/navigation/ProductNavigator.tsx", navigation)

  // Create corresponding native modules
  - Write("ios/Modules/ProductModule.swift", iosModule)
  - Write("android/app/src/main/java/com/app/ProductModule.kt", androidModule)

  // Create shared services
  - Write("src/services/ProductService.ts", productService)
  - Write("__tests__/services/ProductService.test.ts", serviceTests)
```

## Best Practices Summary

### Development Workflow

1. **Always work in parallel** - Create related files (component + styles + tests) simultaneously
2. **Platform-specific optimization** - Use native implementations where performance matters
3. **Share business logic** - Maximize code sharing for services, utilities, and data models
4. **Test comprehensively** - Unit, integration, E2E, and performance tests in parallel
5. **Monitor continuously** - Track performance, crashes, and user behavior across platforms

### Performance Guidelines

- Keep main thread free for UI interactions
- Use FlatList for long lists with proper optimization
- Implement intelligent caching strategies
- Batch network requests to reduce battery usage
- Profile regularly with platform-specific tools

### Security Best Practices

- Encrypt sensitive data with platform-native solutions
- Implement certificate pinning for API calls
- Detect jailbreak/root and adjust security accordingly
- Never store secrets in code or version control
- Follow platform security guidelines (iOS/Android)

### Deployment Checklist

- [ ] Configure environment variables for each environment
- [ ] Set up Fastlane for automated deployments
- [ ] Implement proper code signing
- [ ] Test on real devices across iOS and Android
- [ ] Set up crash reporting and analytics
- [ ] Configure App Store/Play Store metadata
- [ ] Run full test suite before deployment
- [ ] Monitor post-deployment metrics

---

**Note**: This guide emphasizes parallel development workflows to maximize efficiency. Always create related files (components, tests, styles, platform implementations) in a single batch operation rather than sequentially.

For complete documentation including security patterns, testing strategies, performance optimization, and platform-specific features, see the full version in your project root.
