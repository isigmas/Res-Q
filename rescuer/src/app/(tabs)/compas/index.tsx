import { Compass } from "@/src/components/Compas";
import { useRescuerSocket } from "@/src/contexts/WebSocketContext";
import { StyleSheet, View } from "react-native";

import { ActivityIndicator, Text } from "react-native";
import { ReadyState } from "react-use-websocket";

const Compas = () => {
  const { lostPersonLocation, readyState } = useRescuerSocket();

  if (readyState === ReadyState.CONNECTING) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={styles.loadingText}>Łączenie z serwerem...</Text>
      </View>
    );
  }

  if (readyState === ReadyState.CLOSED || readyState === ReadyState.CLOSING) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F44336" />
        <Text style={styles.loadingText}>
          Połączenie zerwane. Próba ponownego...
        </Text>
      </View>
    );
  }

  if (!lostPersonLocation) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          Połączono. Oczekiwanie na lokalizację zaginionej osoby...
        </Text>
      </View>
    );
  }

  const targetCoordinates = {
    latitude: lostPersonLocation.latitude,
    longitude: lostPersonLocation.longitude,
  };

  return (
    <>
      <Compass targetCoordinates={targetCoordinates} targetName={"Victim"} />
    </>
  );
};

const styles = StyleSheet.create({
  picker: {
    fontSize: 20,
    color: "#000000",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    padding: 10,
    margin: 10,
  },
  item: {
    fontSize: 18,
    color: "#000000",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 20,
  },
  loadingText: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
});

export default Compas;
