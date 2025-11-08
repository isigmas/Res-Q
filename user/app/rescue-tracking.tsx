import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Image,
    Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, useRef } from "react";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useUserSocket } from "@/contexts/WebSocketContext";

interface Coordinates {
    latitude: number;
    longitude: number;
}

export default function RescueTrackingScreen() {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const { rescuerLocation: rescuerLocationFromWS } = useUserSocket();

    const [userLocation, setUserLocation] = useState<Coordinates>({
        latitude: 50.0614,
        longitude: 19.9366,
    });
    const [rescuerLocation, setRescuerLocation] = useState<Coordinates>({
        latitude: 51.1079,
        longitude: 17.0385,
    });
    const [distance, setDistance] = useState<number>(2.3);
    const [eta, setEta] = useState<number>(8);
    const [isLoading, setIsLoading] = useState(true);

    // Animacja pulsowania dla czerwonego cienia
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        getUserLocation();

        // Uruchom animację pulsowania
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.6,
                    duration: 1500,
                    useNativeDriver: false,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 1500,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    // Funkcja do obliczania odległości między dwoma punktami (Haversine formula)
    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number => {
        const R = 6371; // Promień Ziemi w km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Aktualizuj lokalizację ratownika z WebSocket
    useEffect(() => {
        if (
            rescuerLocationFromWS &&
            rescuerLocationFromWS.data &&
            typeof rescuerLocationFromWS.data.latitude === "number" &&
            typeof rescuerLocationFromWS.data.longitude === "number"
        ) {
            console.log(
                "[RescueTracking] Aktualizacja lokalizacji ratownika:",
                rescuerLocationFromWS
            );

            const lat = rescuerLocationFromWS.data.latitude;
            const lng = rescuerLocationFromWS.data.longitude;

            setRescuerLocation({
                latitude: lat,
                longitude: lng,
            });

            // Oblicz odległość i ETA
            const dist = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                lat,
                lng
            );
            setDistance(dist);

            // Załóżmy średnią prędkość 40 km/h
            const estimatedTime = (dist / 40) * 60; // w minutach
            setEta(Math.round(estimatedTime));

            // Dopasuj widok mapy do obu markerów
            if (mapRef.current) {
                mapRef.current.fitToCoordinates(
                    [userLocation, { latitude: lat, longitude: lng }],
                    {
                        edgePadding: { top: 100, bottom: 350, left: 50, right: 50 },
                        animated: true,
                    }
                );
            }
        }
    }, [rescuerLocationFromWS, userLocation]);

    const getUserLocation = async () => {
        try {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.log("Permission to access location was denied");
                setIsLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            setIsLoading(false);
        } catch (error) {
            console.error("Error getting location:", error);
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>
                    Pobieranie lokalizacji...
                </Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerBackVisible: false,
                    headerStyle: {
                        backgroundColor: "#d32f2f",
                    },
                    headerTintColor: "#fff",
                    headerTitle: () => (
                        <View style={styles.headerContent}>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>
                                    Pomoc wezwana
                                </Text>
                                <Text style={styles.headerSubtitle}>
                                    Ratownik jest już w drodze
                                </Text>
                            </View>
                        </View>
                    ),
                    headerTitleAlign: "center",
                    headerShadowVisible: false,
                }}
            />
            <View style={styles.container}>
                {/* Pulsujący czerwony gradient na górze */}
                <Animated.View
                    style={[
                        styles.pulseShadowContainer,
                        {
                            opacity: pulseAnim,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={[
                            "rgba(211, 47, 47, 0.8)",
                            "rgba(211, 47, 47, 0)",
                        ]}
                        style={styles.pulseShadow}
                    />
                </Animated.View>

                {/* Mapa */}
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={{
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                >
                    {/* Marker użytkownika */}
                    <Marker
                        coordinate={userLocation}
                        title="Twoja lokalizacja"
                        pinColor="#ff7e7b"
                    >
                        <View style={styles.markerContainer}>
                            <Image
                                source={require("@/assets/images/user-avatar.png")}
                                style={styles.markerImage}
                            />
                        </View>
                    </Marker>

                    {/* Marker ratownika */}
                    <Marker
                        coordinate={rescuerLocation}
                        title="Ratownik"
                        description="W drodze do Ciebie"
                        pinColor="#4caf50"
                    >
                        <View style={styles.markerContainer}>
                            <Image
                                source={require("@/assets/images/rescurer.png")}
                                style={styles.markerImage}
                            />
                        </View>
                    </Marker>
                </MapView>

                {/* Panel informacyjny na dole */}
                <View style={styles.infoPanel}>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>
                            Ratownik jest już w drodze
                        </Text>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{eta} min</Text>
                            <Text style={styles.statLabel}>
                                Estymowany czas przybycia
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>
                                {distance.toFixed(1)} km
                            </Text>
                            <Text style={styles.statLabel}>Odległość</Text>
                        </View>
                    </View>

                    <View style={styles.rescuerInfo}>
                        <Image
                            source={require("@/assets/images/rescurer.png")}
                            style={styles.rescuerAvatar}
                        />
                        <View style={styles.rescuerDetails}>
                            <Text style={styles.rescuerName}>
                                Ratownik Michał
                            </Text>
                            <Text style={styles.rescuerRole}>
                                Ratownik TOPR
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5FA",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5FA",
    },
    loadingText: {
        fontSize: 16,
        color: "#666",
        marginTop: 16,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerTextContainer: {
        paddingTop: 4,
        paddingBottom: 4,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "600",
        textAlign: "center",
        color: "#fff",
        letterSpacing: 0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        color: "#ffcdd2",
        textAlign: "center",
        marginTop: 2,
        fontWeight: "400",
    },
    pulseShadowContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 1,
        pointerEvents: "none",
    },
    pulseShadow: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 4,
        borderColor: "#fff",
        overflow: "hidden",
        backgroundColor: "#fff",
    },
    markerImage: {
        width: 60,
        height: 60,
        resizeMode: "cover",
    },
    infoPanel: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F5E9",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#4caf50",
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2e7d32",
    },
    statsContainer: {
        flexDirection: "row",
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
    },
    divider: {
        width: 1,
        backgroundColor: "#E0E0E0",
        marginHorizontal: 16,
    },
    rescuerInfo: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5FA",
        padding: 16,
        borderRadius: 12,
    },
    rescuerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    rescuerDetails: {
        flex: 1,
    },
    rescuerName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 2,
    },
    rescuerRole: {
        fontSize: 13,
        color: "#666",
    },
});
