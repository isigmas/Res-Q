import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import { useMap } from '@/contexts/MapContext';

export default function Map() {
  const { center, zoom } = useMap();

  // Convert zoom level (0-20) to latitudeDelta for react-native-maps
  // Higher zoom = smaller delta (more zoomed in)
  const latitudeDelta = Math.exp(Math.log(360) - (zoom * Math.LN2));
  const longitudeDelta = latitudeDelta;

  return (
    <MapView
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
      showsMyLocationButton={true}
      showsCompass={true}
      showsScale={true}
      rotateEnabled={true}
      pitchEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
