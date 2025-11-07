import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const router = useRouter();

  const handleSOSPress = () => {
    console.log('SOS button pressed');
    // TODO: Implement SOS functionality
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: '#666',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}>
        <Tabs.Screen
          name="navigation"
          options={{
            title: 'Navigation',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={24} name="location.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="weather-radar"
          options={{
            title: 'Weather',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={24} name="cloud.rain.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.homeIconContainer, focused && styles.homeIconFocused]}>
                <IconSymbol size={32} name="house.fill" color={focused ? '#fff' : color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="share-location"
          options={{
            title: 'Share',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={24} name="location.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="saved-maps"
          options={{
            title: 'Maps',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={24} name="map.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Floating SOS Button */}
      <Pressable
        style={({ pressed }) => [
          styles.sosButton,
          pressed && styles.sosButtonPressed,
        ]}
        onPress={handleSOSPress}>
        <IconSymbol size={32} name="exclamationmark.triangle.fill" color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  homeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    borderWidth: 3,
    borderColor: '#fff',
  },
  homeIconFocused: {
    backgroundColor: '#0a7ea4',
  },
  sosButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
