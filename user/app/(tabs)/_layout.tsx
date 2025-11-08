import { Tabs } from "expo-router";
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { useRouter } from "expo-router";
import { RouteIcon } from "@/components/icons/RouteIcon";
import { CloudBoltIcon } from "@/components/icons/CloudBoltIcon";
import { ShareNodesIcon } from "@/components/icons/ShareNodesIcon";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { HomeIcon } from "@/components/icons/HomeIcon";

export default function TabLayout() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: "#172f44",
                    tabBarInactiveTintColor: "#9ca3af",
                    headerShown: false,
                    tabBarButton: HapticTab,
                    tabBarStyle: {
                        backgroundColor: "#ffffff",
                        borderTopWidth: 0,
                        height: Platform.OS === "ios" ? 55 + insets.bottom : 88,
                        paddingBottom:
                            Platform.OS === "ios" ? insets.bottom + 2 : 12,
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 10,
                        elevation: 20,
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: -4,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: "700",
                        letterSpacing: 0.2,
                        marginTop: 4,
                    },
                    tabBarItemStyle: {
                        paddingVertical: 4,
                        borderRadius: 16,
                    },
                    tabBarAllowFontScaling: false,
                }}
            >
                <Tabs.Screen
                    name="navigation"
                    options={{
                        title: "Planowanie Tras",
                        tabBarIcon: ({ color, focused }) => (
                            <RouteIcon size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="weather-radar"
                    options={{
                        title: "Radar Pogodowy",
                        tabBarIcon: ({ color, focused }) => (
                            <CloudBoltIcon size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "",
                        tabBarIcon: ({ focused }) => (
                            <View
                                style={[
                                    styles.homeIconContainer,
                                    focused && styles.homeIconFocused,
                                ]}
                            >
                                <HomeIcon size={32} color="#fff" />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="share-location"
                    options={{
                        title: "Udostępnij lokalizację",
                        tabBarIcon: ({ color, focused }) => (
                            <ShareNodesIcon size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="saved-maps"
                    options={{
                        title: "Pobrane mapy",
                        tabBarIcon: ({ color, focused }) => (
                            <DownloadIcon size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="explore"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    homeIconContainer: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: "#172f44",
        justifyContent: "center",
        alignItems: "center",
        marginTop: -18,
        borderWidth: 4,
        borderColor: "#fff",
        shadowColor: "#172f44",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    homeIconFocused: {
        backgroundColor: "#1a3a52",
        transform: [{ scale: 1.05 }],
    },
});
