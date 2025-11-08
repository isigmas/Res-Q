import { Compass } from "@/src/components/Compas";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import { StyleSheet } from "react-native";

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
  const [currentLocation, setCurrentLocation] = useState<Location>(
    LocationData[0]
  );
  const handleLocationSelect = (location: Location) => {
    setCurrentLocation(location);
  };

  return (
    <>
      <Compass
        targetCoordinates={currentLocation.coordinates}
        targetName={currentLocation.name}
      />
      <Picker
        selectedValue={currentLocation.name}
        onValueChange={(itemValue) => {
          const selected = LocationData.find((loc) => loc.name === itemValue);
          if (selected) handleLocationSelect(selected);
        }}
        style={styles.picker}
        itemStyle={styles.item}
      >
        {LocationData.map((loc) => (
          <Picker.Item key={loc.name} label={loc.name} value={loc.name} />
        ))}
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
});

export default Compas;
