import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useMap } from '@/contexts/MapContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function Map() {
  const { center, zoom, setCenter } = useMap();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Convert zoom level (0-20) to latitudeDelta for react-native-maps
  // Higher zoom = smaller delta (more zoomed in)
  const latitudeDelta = Math.exp(Math.log(360) - (zoom * Math.LN2));
  const longitudeDelta = latitudeDelta;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your position');
        return;
      }
      setHasPermission(true);

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation(location);

      // Watch location updates
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setUserLocation(newLocation);
        }
      );
    })();
  }, []);

  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      const region: Region = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 1000);
      setCenter([userLocation.coords.longitude, userLocation.coords.latitude]);
    } else {
      Alert.alert('Location Not Available', 'Unable to get your current location');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType="terrain"
        initialRegion={{
          latitude: center[1],
          longitude: center[0],
          latitudeDelta,
          longitudeDelta,
        }}
        showsUserLocation={true}
        showsCompass={true}
        showsScale={true}
        rotateEnabled={true}
        pitchEnabled={true}
        followsUserLocation={false}
      />

      {/* Center on User Button */}
      {hasPermission && (
        <Pressable
          style={({ pressed }) => [
            styles.centerButton,
            pressed && styles.centerButtonPressed,
          ]}
          onPress={handleCenterOnUser}>
          <IconSymbol size={24} name="location.fill" color="#000" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  centerButtonPressed: {
    opacity: 0.7,
  },
});
