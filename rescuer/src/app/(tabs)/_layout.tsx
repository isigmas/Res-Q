import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "blue" }}>
      <Tabs.Screen
        name="compas/index"
        options={{
          title: "Kompas",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="compass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map/index"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="map" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
