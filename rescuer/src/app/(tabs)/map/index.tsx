import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, useRef } from "react";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRescuerSocket } from "@/src/contexts/WebSocketContext";

interface Coordinates {
    latitude: number;
    longitude: number;
}

// Stałe dla markerów - łatwe do modyfikacji
const MARKER_CONFIG = {
    WRAPPER_SIZE: 35,
    PULSE_SIZE: 25,
    CIRCLE_SIZE: 20,
    BORDER_WIDTH: 4,
    BORDER_COLOR: '#ffffff',
    PULSE_OPACITY: 0.3,
    COLORS: {
        RESCUER: '#4caf50',
        TOURIST: '#ff7e7b',
    },
};

// Komponent markera - reużywalny
const CustomMarker = ({ 
    color, 
    pulseAnimation 
}: { 
    color: string; 
    pulseAnimation: Animated.Value;
}) => (
    <View style={markerStyles.container}>
        <Animated.View
            style={[
                markerStyles.pulse,
                {
                    backgroundColor: color,
                    transform: [{ scale: pulseAnimation }],
                },
            ]}
        />
        <View style={[markerStyles.circle, { backgroundColor: color }]} />
    </View>
);

// Style markerów - oddzielne dla łatwiejszej edycji
const markerStyles = StyleSheet.create({
    container: {
        width: MARKER_CONFIG.WRAPPER_SIZE,
        height: MARKER_CONFIG.WRAPPER_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulse: {
        position: 'absolute',
        width: MARKER_CONFIG.PULSE_SIZE,
        height: MARKER_CONFIG.PULSE_SIZE,
        borderRadius: MARKER_CONFIG.PULSE_SIZE / 2,
        opacity: MARKER_CONFIG.PULSE_OPACITY,
    },
    circle: {
        width: MARKER_CONFIG.CIRCLE_SIZE,
        height: MARKER_CONFIG.CIRCLE_SIZE,
        borderRadius: MARKER_CONFIG.CIRCLE_SIZE / 2,
        borderWidth: MARKER_CONFIG.BORDER_WIDTH,
        borderColor: MARKER_CONFIG.BORDER_COLOR,
    },
});

// Jasny styl mapy
const mapStyle = [
    {
        elementType: "geometry",
        stylers: [{ color: "#f5f5f5" }],
    },
    {
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
    },
    {
        elementType: "labels.text.fill",
        stylers: [{ color: "#616161" }],
    },
    {
        elementType: "labels.text.stroke",
        stylers: [{ color: "#f5f5f5" }],
    },
    {
        featureType: "administrative.land_parcel",
        elementType: "labels.text.fill",
        stylers: [{ color: "#bdbdbd" }],
    },
    {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#eeeeee" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#e5e5e5" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }],
    },
    {
        featureType: "road.arterial",
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#dadada" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#616161" }],
    },
    {
        featureType: "road.local",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }],
    },
    {
        featureType: "transit.line",
        elementType: "geometry",
        stylers: [{ color: "#e5e5e5" }],
    },
    {
        featureType: "transit.station",
        elementType: "geometry",
        stylers: [{ color: "#eeeeee" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#c9c9c9" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }],
    },
];

export default function RescueTrackingScreen() {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const { lostPersonLocation } = useRescuerSocket();

    const [rescuerLocation, setRescuerLocation] = useState<Coordinates>({
        latitude: 51.0614,
        longitude: 19.9366,
    });
    const [touristLocation, setTouristLocation] = useState<Coordinates>({
        latitude: 51.1079,
        longitude: 17.0385,
    });
    const [distance, setDistance] = useState<number>(2.3);
    const [eta, setEta] = useState<number>(8);
    const [isLoading, setIsLoading] = useState(true);

    // Animacja pulsowania dla czerwonego cienia
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    // Animacje pulsowania dla markerów
    const userMarkerPulse = useRef(new Animated.Value(1)).current;
    const rescuerMarkerPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        getUserLocation();

        // Uruchom animację pulsowania dla nagłówka
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

        // Animacja pulsowania dla markera użytkownika (czerwony)
        Animated.loop(
            Animated.sequence([
                Animated.timing(userMarkerPulse, {
                    toValue: 1.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(userMarkerPulse, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Animacja pulsowania dla markera ratownika (zielony)
        Animated.loop(
            Animated.sequence([
                Animated.timing(rescuerMarkerPulse, {
                    toValue: 1.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(rescuerMarkerPulse, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
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

    // Aktualizuj lokalizację turysty z WebSocket
    useEffect(() => {
        if (
            lostPersonLocation &&
            typeof lostPersonLocation.latitude === "number" &&
            typeof lostPersonLocation.longitude === "number"
        ) {
            console.log(
                "[RescueTracking] Aktualizacja lokalizacji turysty:",
                lostPersonLocation
            );

            const lat = lostPersonLocation.latitude;
            const lng = lostPersonLocation.longitude;

            setTouristLocation({
                latitude: lat,
                longitude: lng,
            });

            // Oblicz odległość i ETA
            const dist = calculateDistance(
                rescuerLocation.latitude,
                rescuerLocation.longitude,
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
                    [rescuerLocation, { latitude: lat, longitude: lng }],
                    {
                        edgePadding: {
                            top: 100,
                            bottom: 350,
                            left: 50,
                            right: 50,
                        },
                        animated: true,
                    }
                );
            }
        }
    }, [lostPersonLocation, rescuerLocation]);

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
            setRescuerLocation({
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
                        backgroundColor: "#4caf50",
                    },
                    headerTintColor: "#fff",
                    headerTitle: () => (
                        <View style={styles.headerContent}>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>
                                    Misja ratunkowa
                                </Text>
                                <Text style={styles.headerSubtitle}>
                                    Lokalizacja zaginionego turysty
                                </Text>
                            </View>
                        </View>
                    ),
                    headerTitleAlign: "center",
                    headerShadowVisible: false,
                }}
            />
            <View style={styles.container}>
                {/* Pulsujący zielony gradient na górze */}
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
                            "rgba(76, 175, 80, 0.8)",
                            "rgba(76, 175, 80, 0)",
                        ]}
                        style={styles.pulseShadow}
                    />
                </Animated.View>

                {/* Mapa */}
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                        latitude: rescuerLocation.latitude,
                        longitude: rescuerLocation.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                >
                    {/* Marker ratownika (zielony) - Twoja lokalizacja */}
                    <Marker
                        coordinate={rescuerLocation}
                        title="Twoja lokalizacja (Ratownik)"
                    >
                        <CustomMarker 
                            color={MARKER_CONFIG.COLORS.RESCUER}
                            pulseAnimation={rescuerMarkerPulse}
                        />
                    </Marker>

                    {/* Marker turysty (czerwony) - Lokalizacja zaginionego */}
                    <Marker
                        coordinate={touristLocation}
                        title="Zaginiony turysta"
                        description="Oczekuje na pomoc"
                    >
                        <CustomMarker 
                            color={MARKER_CONFIG.COLORS.TOURIST}
                            pulseAnimation={userMarkerPulse}
                        />
                    </Marker>
                </MapView>

                {/* Panel informacyjny na dole */}
                <View style={styles.infoPanel}>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>
                            W drodze do zaginionego
                        </Text>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{eta} min</Text>
                            <Text style={styles.statLabel}>
                                Estymowany czas dotarcia
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>
                                {distance.toFixed(2)} km
                            </Text>
                            <Text style={styles.statLabel}>Odległość do celu</Text>
                        </View>
                    </View>

                    <View style={styles.rescuerInfo}>
                        <View style={styles.rescuerAvatarPlaceholder}>
                            <Text style={styles.rescuerAvatarEmoji}>🆘</Text>
                        </View>
                        <View style={styles.rescuerDetails}>
                            <Text style={styles.rescuerName}>
                                Zaginiony turysta
                            </Text>
                            <Text style={styles.rescuerRole}>
                                Oczekuje na pomoc
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
    rescuerAvatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: "#ff7e7b",
        justifyContent: "center",
        alignItems: "center",
    },
    rescuerAvatarEmoji: {
        fontSize: 24,
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