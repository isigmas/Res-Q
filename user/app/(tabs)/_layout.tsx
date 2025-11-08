import { Tabs } from "expo-router";
import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import { RouteIcon } from "@/components/icons/RouteIcon";
import { CloudBoltIcon } from "@/components/icons/CloudBoltIcon";
import { ShareNodesIcon } from "@/components/icons/ShareNodesIcon";
import { DownloadIcon } from "@/components/icons/DownloadIcon";

export default function TabLayout() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: "#000",
                    tabBarInactiveTintColor: "#abababff",
                    headerShown: false,
                    tabBarButton: HapticTab,
                    tabBarStyle: {
                        backgroundColor: "#fff",
                        borderTopWidth: 1,
                        borderTopColor: "#e0e0e0",
                        height: 90,
                        paddingBottom: 10,
                        paddingLeft: 10,
                        paddingRight: 10,
                        paddingTop: 8,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: "600",
                        height: 32,
                        lineHeight: 14,
                    },
                    tabBarItemStyle: {
                        paddingVertical: 2,
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
                        tabBarIcon: ({ color, focused }) => (
                            <View
                                style={[
                                    styles.homeIconContainer,
                                    focused && styles.homeIconFocused,
                                ]}
                            >
                                <IconSymbol
                                    size={48}
                                    name="house.fill"
                                    color={focused ? "#fff" : color}
                                />
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
        width: 66,
        height: 66,
        borderRadius: 38,
        backgroundColor: "#172f44",
        justifyContent: "center",
        alignItems: "center",
        marginTop: -15,
        borderWidth: 3,
        borderColor: "#fff",
    },
    homeIconFocused: {
        backgroundColor: "#172f44",
    },
});
