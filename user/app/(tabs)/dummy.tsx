import React from "react";
import { StyleSheet, View } from "react-native";
import { LocationDisplay } from "@/components/LocationDisplay";

const Dummy = () => {
  return (
    <View style={styles.container}>
      <LocationDisplay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
});

export default Dummy;
