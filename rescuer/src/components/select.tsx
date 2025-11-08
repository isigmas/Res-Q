import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Menu } from "react-native-paper";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type Location = {
  coordinates: Coordinates;
  name: string;
};

const LocationData: Location[] = [
  {
    coordinates: { latitude: 49.4849, longitude: 20.023 },
    name: "Nowy Targ",
  },
  {
    coordinates: { latitude: 54.3527, longitude: 18.6411 },
    name: "Gdańsk",
  },
];

interface LocationSelectorProps {
  onSelect: (location: Location) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  onSelect,
}) => {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<Location | null>(null);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSelect = (location: Location) => {
    setSelected(location);
    onSelect(location);
    closeMenu();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Choose location:</Text>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button mode="outlined" onPress={openMenu}>
            {selected ? selected.name : "Select location"}
          </Button>
        }
      >
        {LocationData.map((loc) => (
          <Menu.Item
            key={loc.name}
            onPress={() => handleSelect(loc)}
            title={loc.name}
          />
        ))}
      </Menu>
      {selected && (
        <View style={styles.info}>
          <Text style={styles.infoText}>
            Latitude: {selected.coordinates.latitude}
          </Text>
          <Text style={styles.infoText}>
            Longitude: {selected.coordinates.longitude}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  info: {
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#555",
  },
});
