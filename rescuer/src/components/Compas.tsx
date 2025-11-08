import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCompass } from "../hooks/useCompass";

const { width } = Dimensions.get("window");

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface CompassProps {
  targetCoordinates: Coordinates;
  targetName?: string;
}

export const Compass: React.FC<CompassProps> = ({
  targetCoordinates,
  targetName = "Target",
}) => {
  const { bearing, distance, heading, error, isLoading } =
    useCompass(targetCoordinates);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const previousRotation = useRef(0);

  const targetRotation = bearing - heading;

  useEffect(() => {
    const normalizeAngle = (angle: number) => {
      while (angle > 180) angle -= 360;
      while (angle < -180) angle += 360;
      return angle;
    };

    const normalizedTarget = normalizeAngle(
      targetRotation - previousRotation.current
    );
    previousRotation.current += normalizedTarget;

    Animated.spring(rotationAnim, {
      toValue: previousRotation.current,
      useNativeDriver: true,
      tension: 50,
      friction: 15,
    }).start();
  }, [targetRotation]);

  const formatDistance = (distanceInKm: number): string => {
    if (distanceInKm < 1) {
      return `${(distanceInKm * 1000).toFixed(0)} m`;
    }
    return `${distanceInKm.toFixed(2)} km`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <Text style={styles.helperText}>
          Proszę upewnij się, że zezwoliłeś aplikacji na dostęp do lokalizacji
        </Text>
      </View>
    );
  }

  const rotation = rotationAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* Strzałka kompasu */}
      <Animated.View
        style={[
          styles.arrowContainer,
          {
            transform: [{ rotate: rotation }],
          },
        ]}
      >
        <View style={styles.arrow} />
      </Animated.View>
      {/* jakieś tam informacje */}
      <View style={styles.infoContainer}>
        <Text style={styles.targetName}>{targetName}</Text>
        <Text style={styles.distanceText}>{formatDistance(distance)}</Text>
        <Text style={styles.bearingText}>
          Stopnie celu: {Math.round(bearing)}° | Stopnie urządzenia:{" "}
          {Math.round(heading)}°
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 20,
  },
  arrowContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 60,
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 30,
    borderRightWidth: 30,
    borderBottomWidth: 140,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  infoContainer: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 15,
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  targetName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  distanceText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 5,
  },
  bearingText: {
    fontSize: 14,
    color: "#666",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 10,
  },
  helperText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
