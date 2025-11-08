import * as Location from "expo-location";
import { useEffect, useState } from "react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface CompassData {
  bearing: number;
  distance: number;
  currentLocation: Coordinates | null;
  heading: number;
  error: string | null;
  isLoading: boolean;
}

export const useCompass = (targetCoordinates: Coordinates): CompassData => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    null
  );
  const [heading, setHeading] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Calculate bearing between two coordinates
  const calculateBearing = (from: Coordinates, to: Coordinates): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const lat1 = toRad(from.latitude);
    const lat2 = toRad(to.latitude);
    const dLon = toRad(to.longitude - from.longitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = toDeg(Math.atan2(y, x));
    bearing = (bearing + 360) % 360;

    return bearing;
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (from: Coordinates, to: Coordinates): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from.latitude)) *
        Math.cos(toRad(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  // Request location permissions and start tracking
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const setupLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setError("Location permission denied");
          setIsLoading(false);
          return;
        }

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setIsLoading(false);

        // Watch location changes
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5, // Update every 5 meters
          },
          (location) => {
            setCurrentLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
      } catch (err) {
        setError("Failed to get location");
        setIsLoading(false);
      }
    };

    setupLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Track device heading using Location.watchHeadingAsync
  useEffect(() => {
    let headingSubscription: Location.LocationSubscription | null = null;

    const setupHeading = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          return;
        }

        // Use Location.watchHeadingAsync for proper compass heading
        // This automatically compensates for device tilt
        headingSubscription = await Location.watchHeadingAsync(
          (headingData) => {
            // magHeading gives us the magnetic heading (0-360)
            // This is the direction the device is pointing in the horizontal plane
            const magneticHeading = headingData.magHeading;
            setHeading(magneticHeading);
          }
        );
      } catch (err) {
        setError("Failed to access compass");
      }
    };

    setupHeading();

    return () => {
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  // Calculate bearing and distance
  const bearing = currentLocation
    ? calculateBearing(currentLocation, targetCoordinates)
    : 0;

  const distance = currentLocation
    ? calculateDistance(currentLocation, targetCoordinates)
    : 0;

  return {
    bearing,
    distance,
    currentLocation,
    heading,
    error,
    isLoading,
  };
};
