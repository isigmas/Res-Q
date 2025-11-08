import { Stack } from "expo-router";
import { RescuerSocketProvider } from "../contexts/WebSocketContext";

export default function Layout() {
  return (
    <RescuerSocketProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </RescuerSocketProvider>
  );
}
