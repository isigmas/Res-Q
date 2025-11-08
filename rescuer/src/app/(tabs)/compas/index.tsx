import { Compass } from "@/src/components/Compas";
import { useRescuerSocket } from "@/src/contexts/WebSocketContext";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface Location {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  name: string;
}

const LocationData: Location[] = [
  {
    coordinates: {
      latitude: 49.4849,
      longitude: 20.023,
    },
    name: "Nowy Targ",
  },
  {
    coordinates: {
      latitude: 54.3527,
      longitude: 18.6411,
    },
    name: "Gdańsk",
  },
];
const Compas = () => {
  const { lostPersonLocation } = useRescuerSocket();
  const [currentLocation, setCurrentLocation] = useState<Location>(
    LocationData[0]
  );
  const [selectedValue, setSelectedValue] = useState<string>("Nowy Targ");

  useEffect(() => {
    if (selectedValue === "Zaginiony" && lostPersonLocation) {
      setCurrentLocation({
        coordinates: {
          latitude: lostPersonLocation.latitude,
          longitude: lostPersonLocation.longitude,
        },
        name: "Zaginiony",
      });
    }
  }, [lostPersonLocation, selectedValue]);

  const handleLocationSelect = (itemValue: string) => {
    setSelectedValue(itemValue);
    
    if (itemValue === "Zaginiony") {
      if (lostPersonLocation) {
        setCurrentLocation({
          coordinates: {
            latitude: lostPersonLocation.latitude,
            longitude: lostPersonLocation.longitude,
          },
          name: "Zaginiony",
        });
      }
    } else {
      const selected = LocationData.find((loc) => loc.name === itemValue);
      if (selected) {
        setCurrentLocation(selected);
      }
    }
  };

  return (
    <>
      <Compass
        targetCoordinates={currentLocation.coordinates}
        targetName={currentLocation.name}
      />
      {selectedValue === "Zaginiony" && !lostPersonLocation && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Czekam na lokalizację zaginionego...
          </Text>
        </View>
      )}
      <Picker
        selectedValue={selectedValue}
        onValueChange={handleLocationSelect}
        style={styles.picker}
        itemStyle={styles.item}
      >
        {LocationData.map((loc) => (
          <Picker.Item key={loc.name} label={loc.name} value={loc.name} />
        ))}
        <Picker.Item 
          key="Zaginiony" 
          label="Zaginiony" 
          value="Zaginiony" 
        />
      </Picker>
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
  warningContainer: {
    backgroundColor: "#FFF3CD",
    padding: 10,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  warningText: {
    fontSize: 14,
    color: "#856404",
    textAlign: "center",
  },
});

export default Compas;
