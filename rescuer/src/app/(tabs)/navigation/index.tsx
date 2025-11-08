import { LocationDisplay } from "@/src/components/LocationDisplay";
import { View } from "react-native";

const Navigation = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <LocationDisplay />
    </View>
  );
};

export default Compas;
