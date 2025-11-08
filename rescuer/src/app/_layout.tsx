import { Stack } from "expo-router";
import { RescuerLocationTracker } from "../components/RescuerLocationTracker";
import { RescuerSocketProvider } from "../contexts/WebSocketContext";

export default function Layout() {
  return (
    <RescuerSocketProvider>
      <RescuerLocationTracker />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </RescuerSocketProvider>
  );
}
