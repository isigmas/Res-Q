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
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import { readAsStringAsync } from "expo-file-system/legacy";

const MAPBOX_ACCESS_TOKEN =
    "pk.eyJ1Ijoic2tvd3J4biIsImEiOiJjbWhwZGswMzUwNHBhMmlzNzJha2JqazhzIn0.CQTtvYmdrKFdM9pccP0KFQ";
const MAPBOX_STYLE = "mapbox://styles/mapbox/outdoors-v12";

interface Coordinates {
    latitude: number;
    longitude: number;
}

export default function RescueTrackingScreen() {
    const router = useRouter();
    const webViewRef = useRef<WebView>(null);

    const [userLocation, setUserLocation] = useState<Coordinates>({
        latitude: 50.0614,
        longitude: 19.9366,
    });
    const [rescuerLocation] = useState<Coordinates>({
        latitude: 51.1079,
        longitude: 17.0385,
    });
    const [distance] = useState<number>(2.3);
    const [eta] = useState<number>(8);
    const [isLoading, setIsLoading] = useState(true);
    const [avatarsLoaded, setAvatarsLoaded] = useState(false);
    const [userAvatarUri, setUserAvatarUri] = useState<string>("");
    const [rescuerAvatarUri, setRescuerAvatarUri] = useState<string>("");

    // Animacja pulsowania dla czerwonego cienia
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        getUserLocation();
        loadAvatars();

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

    const loadAvatars = async () => {
        try {
            const [userAsset, rescuerAsset] = await Asset.loadAsync([
                require("@/assets/images/user-avatar.png"),
                require("@/assets/images/rescurer.png"),
            ]);

            // Pobierz URI lokalnych plików
            const userUri = userAsset.localUri || userAsset.uri;
            const rescuerUri = rescuerAsset.localUri || rescuerAsset.uri;

            console.log("User URI:", userUri);
            console.log("Rescuer URI:", rescuerUri);

            // Konwertuj do base64
            const userBase64 = await readAsStringAsync(userUri, {
                encoding: "base64",
            });
            const rescuerBase64 = await readAsStringAsync(rescuerUri, {
                encoding: "base64",
            });

            setUserAvatarUri(`data:image/png;base64,${userBase64}`);
            setRescuerAvatarUri(`data:image/png;base64,${rescuerBase64}`);
            setAvatarsLoaded(true);
        } catch (error) {
            console.error("Error loading avatars:", error);
            // Użyj domyślnych kolorów jako fallback
            setAvatarsLoaded(true);
        }
    };

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

    if (isLoading || !avatarsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>
                    Pobieranie lokalizacji...
                </Text>
            </View>
        );
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
  <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
  <style>
    body { margin: 0; padding: 0; }
    #map { position: absolute; top: 0; bottom: 0; width: 100%; }

    .custom-marker {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 4px solid white;
      cursor: pointer;
      background-size: cover;
      background-position: center;
      transition: transform 0.2s;
      position: relative;
    }

    .custom-marker:hover {
      transform: scale(1.1);
    }

    .custom-marker.user {
      border-color: #fff;
      animation: pulse-user 2s infinite;
    }

    .custom-marker.rescuer {
      border-color: #fff;
      animation: pulse-rescuer 2s infinite;
    }

    @keyframes pulse-user {
      0% {
        box-shadow: 0 0 0 0 rgba(255, 126, 123, 0.7);
      }
      50% {
        box-shadow: 0 0 0 20px rgba(255, 126, 123, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(255, 126, 123, 0);
      }
    }

    @keyframes pulse-rescuer {
      0% {
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
      }
      50% {
        box-shadow: 0 0 0 20px rgba(76, 175, 80, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
      }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';

    const map = new mapboxgl.Map({
      container: 'map',
      style: '${MAPBOX_STYLE}',
      center: [${userLocation.longitude}, ${userLocation.latitude}],
      zoom: 13
    });

    map.on('load', () => {
      // Custom marker dla użytkownika
      const userMarkerEl = document.createElement('div');
      userMarkerEl.className = 'custom-marker user';
      userMarkerEl.style.backgroundImage = "url('${userAvatarUri}')";

      new mapboxgl.Marker({ element: userMarkerEl, anchor: 'center' })
        .setLngLat([${userLocation.longitude}, ${userLocation.latitude}])
        .setPopup(new mapboxgl.Popup({ offset: 35 }).setHTML(
          '<div style="text-align: center; padding: 8px;"><strong>Twoja lokalizacja</strong></div>'
        ))
        .addTo(map);

      // Custom marker dla ratownika
      const rescuerMarkerEl = document.createElement('div');
      rescuerMarkerEl.className = 'custom-marker rescuer';
      rescuerMarkerEl.style.backgroundImage = "url('${rescuerAvatarUri}')";

      new mapboxgl.Marker({ element: rescuerMarkerEl, anchor: 'center' })
        .setLngLat([${rescuerLocation.longitude}, ${rescuerLocation.latitude}])
        .setPopup(new mapboxgl.Popup({ offset: 35 }).setHTML(
          '<div style="text-align: center; padding: 8px;"><strong>Ratownik</strong><br/><span style="color: #4caf50; font-size: 12px;">W drodze do Ciebie</span></div>'
        ))
        .addTo(map);

      // Dopasuj widok do obu markerów
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([${userLocation.longitude}, ${userLocation.latitude}]);
      bounds.extend([${rescuerLocation.longitude}, ${rescuerLocation.latitude}]);

      map.fitBounds(bounds, {
        padding: { top: 100, bottom: 350, left: 50, right: 50 }
      });
    });

    map.addControl(new mapboxgl.NavigationControl());
  </script>
</body>
</html>
  `;

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

                {/* Mapa Mapbox */}
                <WebView
                    ref={webViewRef}
                    originWhitelist={["*"]}
                    source={{ html: htmlContent }}
                    style={styles.map}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error("WebView error: ", nativeEvent);
                    }}
                />

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
                                Certyfikowany ratownik medyczny
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
