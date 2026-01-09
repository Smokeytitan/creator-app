/**
 * App Navigator
 * Main navigation structure for the mobile app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../styles/theme';

// Screen placeholder types (to be implemented)
type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  CreatorDetail: { creatorId: string };
  RequestDetail: { requestId: string };
};

type MainTabParamList = {
  Roster: undefined;
  Requests: undefined;
  Kaito: undefined;
  Analytics: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main Tab Navigator
 * Bottom tabs for main app sections
 */
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundSecondary,
          borderTopColor: theme.colors.borderPrimary,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerStyle: {
          backgroundColor: theme.colors.backgroundSecondary,
          borderBottomColor: theme.colors.borderPrimary,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: theme.typography.fontSize.lg,
        },
      }}
    >
      <Tab.Screen
        name="Roster"
        component={PlaceholderScreen}
        options={{
          title: 'Creator Roster',
          // tabBarIcon: ({ color, size }) => <Icon name="users" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Requests"
        component={PlaceholderScreen}
        options={{
          title: 'Content Requests',
          // tabBarIcon: ({ color, size }) => <Icon name="file-text" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Kaito"
        component={PlaceholderScreen}
        options={{
          title: 'Kaito Leaderboard',
          // tabBarIcon: ({ color, size }) => <Icon name="trending-up" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={PlaceholderScreen}
        options={{
          title: 'Analytics',
          // tabBarIcon: ({ color, size }) => <Icon name="bar-chart" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root Stack Navigator
 * Top-level navigation with authentication flow
 */
export default function AppNavigator() {
  // TODO: Add authentication state management
  const isAuthenticated = false;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.backgroundSecondary,
            borderBottomColor: theme.colors.borderPrimary,
            borderBottomWidth: 1,
          },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: theme.typography.fontSize.lg,
          },
          cardStyle: {
            backgroundColor: theme.colors.backgroundPrimary,
          },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreatorDetail"
              component={PlaceholderScreen}
              options={{ title: 'Creator Details' }}
            />
            <Stack.Screen
              name="RequestDetail"
              component={PlaceholderScreen}
              options={{ title: 'Request Details' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={PlaceholderScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Placeholder Screen Component
 * To be replaced with actual screens
 */
import { View, Text, StyleSheet } from 'react-native';

function PlaceholderScreen({ route }: { route?: any }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {route?.name || 'Screen'} - Coming Soon
      </Text>
      <Text style={styles.subtext}>
        This screen will be implemented with full functionality
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundPrimary,
    padding: theme.spacing.lg,
  },
  text: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.sm,
  },
  subtext: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: 'center',
  },
});
