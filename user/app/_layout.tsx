import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";
import { UserSocketProvider } from "../contexts/WebSocketContext";
import { UserLocationTracker } from "../components/UserLocationTracker";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { MapProvider } from "@/contexts/MapContext";

export const unstable_settings = {
    anchor: "(tabs)",
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        if (Platform.OS === "android") {
            // Hide navigation bar on Android
            NavigationBar.setVisibilityAsync("hidden");
            NavigationBar.setBehaviorAsync("overlay-swipe");
            NavigationBar.setBackgroundColorAsync("#00000000");
        }
    }, []);

    return (
        <UserSocketProvider>
            <UserLocationTracker />
            <MapProvider>
                <ThemeProvider
                    value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                >
                    <Stack>
                        <Stack.Screen
                            name="(tabs)"
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="modal"
                            options={{ presentation: "modal", title: "Modal" }}
                        />
                    </Stack>
                    <StatusBar style="auto" />
                </ThemeProvider>
            </MapProvider>
        </UserSocketProvider>
    );
}
