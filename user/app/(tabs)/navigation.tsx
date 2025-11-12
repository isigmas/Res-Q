import React, { useState, useRef, useEffect } from "react";
import {
    StyleSheet,
    View,
    TextInput,
    Pressable,
    Alert,
    ActivityIndicator,
    Text,
    Platform,
    Animated,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const MAPBOX_ACCESS_TOKEN =
    "pk.eyJ1Ijoic2tvd3J4biIsImEiOiJjbWhwZGswMzUwNHBhMmlzNzJha2JqazhzIn0.CQTtvYmdrKFdM9pccP0KFQ";
const MAPBOX_STYLE = "mapbox://styles/mapbox/outdoors-v12";

interface Waypoint {
    id: string;
    name: string;
    lng: number;
    lat: number;
}

export default function NavigationScreen() {
    const insets = useSafeAreaInsets();
    const webViewRef = useRef<WebView>(null);
    const [destination, setDestination] = useState("");
    const [userLocation, setUserLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [startPoint, setStartPoint] = useState<Waypoint | null>(null);
    const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
    const [isAddingStart, setIsAddingStart] = useState(false);
    const [showRoutePanel, setShowRoutePanel] = useState(true);
    const panelHeight = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                setUserLocation({
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                });
            }
        })();
    }, []);

    const handleAddWaypointByName = async () => {
        if (!destination.trim()) {
            Alert.alert("Błąd", "Wprowadź nazwę lokalizacji");
            return;
        }

        try {
            const geocodeResponse = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                    destination
                )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
            );
            const geocodeData = await geocodeResponse.json();

            if (!geocodeData.features || geocodeData.features.length === 0) {
                Alert.alert("Błąd", "Nie znaleziono lokalizacji");
                return;
            }

            const coords = geocodeData.features[0].center;
            const name = geocodeData.features[0].place_name;

            const newWaypoint: Waypoint = {
                id: Date.now().toString(),
                name: name,
                lng: coords[0],
                lat: coords[1],
            };

            setWaypoints([...waypoints, newWaypoint]);
            setDestination("");

            webViewRef.current?.injectJavaScript(`
                window.addWaypointMarker(${JSON.stringify(newWaypoint)});
                true;
            `);
        } catch (error) {
            console.error("Error adding waypoint:", error);
            Alert.alert("Błąd", "Nie udało się dodać lokalizacji");
        }
    };

    const handleMapMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === "mapClick" && isAddingStart) {
                const newStart: Waypoint = {
                    id: "start",
                    name: "Punkt startowy",
                    lng: data.lng,
                    lat: data.lat,
                };

                setStartPoint(newStart);
                setIsAddingStart(false);

                webViewRef.current?.injectJavaScript(`
                    window.setStartMarker(${JSON.stringify(newStart)});
                    window.setAddingStart(false);
                    true;
                `);
            } else if (data.type === "mapClick" && isAddingWaypoint) {
                const newWaypoint: Waypoint = {
                    id: Date.now().toString(),
                    name: `Punkt ${waypoints.length + 1}`,
                    lng: data.lng,
                    lat: data.lat,
                };

                setWaypoints([...waypoints, newWaypoint]);
                setIsAddingWaypoint(false);

                webViewRef.current?.injectJavaScript(`
                    window.addWaypointMarker(${JSON.stringify(newWaypoint)});
                    window.setAddingWaypoint(false);
                    true;
                `);
            }
        } catch (error) {
            console.error("Error handling map message:", error);
        }
    };

    const handleRemoveWaypoint = (id: string) => {
        setWaypoints(waypoints.filter((w) => w.id !== id));
        webViewRef.current?.injectJavaScript(`
            window.removeWaypointMarker('${id}');
            true;
        `);
    };

    const handleToggleAddWaypoint = () => {
        const newState = !isAddingWaypoint;
        setIsAddingWaypoint(newState);
        if (newState) setIsAddingStart(false);
        webViewRef.current?.injectJavaScript(`
            window.setAddingWaypoint(${newState});
            true;
        `);
    };

    const handleToggleAddStart = () => {
        const newState = !isAddingStart;
        setIsAddingStart(newState);
        if (newState) setIsAddingWaypoint(false);
        webViewRef.current?.injectJavaScript(`
            window.setAddingStart(${newState});
            true;
        `);
    };

    const handleUseCurrentLocation = () => {
        if (!userLocation) {
            Alert.alert("Błąd", "Nie można uzyskać Twojej lokalizacji");
            return;
        }

        const currentStart: Waypoint = {
            id: "start",
            name: "Moja lokalizacja",
            lng: userLocation.lng,
            lat: userLocation.lat,
        };

        setStartPoint(currentStart);
        webViewRef.current?.injectJavaScript(`
            window.setStartMarker(${JSON.stringify(currentStart)});
            true;
        `);
    };

    const handleCalculateRoute = async () => {
        const routeStart =
            startPoint ||
            (userLocation
                ? {
                      id: "current",
                      name: "Aktualna lokalizacja",
                      lng: userLocation.lng,
                      lat: userLocation.lat,
                  }
                : null);

        if (!routeStart) {
            Alert.alert("Błąd", "Ustaw punkt startowy");
            return;
        }

        if (waypoints.length === 0) {
            Alert.alert("Błąd", "Dodaj przynajmniej jeden przystanek");
            return;
        }

        setIsLoadingRoute(true);

        try {
            const coords = [
                `${routeStart.lng},${routeStart.lat}`,
                ...waypoints.map((w) => `${w.lng},${w.lat}`),
            ].join(";");

            const directionsResponse = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}&steps=true`
            );
            const directionsData = await directionsResponse.json();

            if (!directionsData.routes || directionsData.routes.length === 0) {
                Alert.alert("Błąd", "Nie znaleziono trasy");
                setIsLoadingRoute(false);
                return;
            }

            const route = directionsData.routes[0];

            webViewRef.current?.injectJavaScript(`
                window.addRoute(${JSON.stringify(route.geometry)});
                true;
            `);
            setIsLoadingRoute(false);
        } catch (error) {
            console.error("Error calculating route:", error);
            Alert.alert("Błąd", "Nie udało się obliczyć trasy");
            setIsLoadingRoute(false);
        }
    };

    const handleClearAll = () => {
        setWaypoints([]);
        setStartPoint(null);
        setDestination("");
        webViewRef.current?.injectJavaScript(`
            window.clearAll();
            true;
        `);
    };

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
    .adding-waypoint { cursor: crosshair !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';

    const map = new mapboxgl.Map({
      container: 'map',
      style: '${MAPBOX_STYLE}',
      center: [${userLocation?.lng || 19.9495}, ${
        userLocation?.lat || 49.2794
    }],
      zoom: 13
    });

    window.map = map;
    window.waypointMarkers = {};
    window.startMarker = null;
    let isAddingWaypoint = false;
    let isAddingStart = false;

    map.on('load', () => {
      ${
          userLocation
              ? `
      new mapboxgl.Marker({ color: '#172f44' })
        .setLngLat([${userLocation.lng}, ${userLocation.lat}])
        .addTo(map);
      `
              : ""
      }

      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#172f44',
          'line-width': 5,
          'line-opacity': 0.8
        }
      });
    });

    map.on('click', (e) => {
      if (isAddingWaypoint || isAddingStart) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapClick',
          lng: e.lngLat.lng,
          lat: e.lngLat.lat
        }));
      }
    });

    window.setAddingWaypoint = function(state) {
      isAddingWaypoint = state;
      if (state) {
        isAddingStart = false;
        map.getCanvas().classList.add('adding-waypoint');
      } else {
        map.getCanvas().classList.remove('adding-waypoint');
      }
    };

    window.setAddingStart = function(state) {
      isAddingStart = state;
      if (state) {
        isAddingWaypoint = false;
        map.getCanvas().classList.add('adding-waypoint');
      } else {
        map.getCanvas().classList.remove('adding-waypoint');
      }
    };

    window.setStartMarker = function(start) {
      if (window.startMarker) {
        window.startMarker.remove();
      }
      window.startMarker = new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([start.lng, start.lat])
        .setPopup(new mapboxgl.Popup().setText(start.name))
        .addTo(map);

      map.flyTo({
        center: [start.lng, start.lat],
        zoom: 14
      });
    };

    window.addWaypointMarker = function(waypoint) {
      const marker = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([waypoint.lng, waypoint.lat])
        .setPopup(new mapboxgl.Popup().setText(waypoint.name))
        .addTo(map);

      window.waypointMarkers[waypoint.id] = marker;

      map.flyTo({
        center: [waypoint.lng, waypoint.lat],
        zoom: 14
      });
    };

    window.removeWaypointMarker = function(id) {
      if (window.waypointMarkers[id]) {
        window.waypointMarkers[id].remove();
        delete window.waypointMarkers[id];
      }
    };

    window.addRoute = function(geometry) {
      map.getSource('route').setData({
        type: 'Feature',
        properties: {},
        geometry: geometry
      });

      const coordinates = geometry.coordinates;
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.fitBounds(bounds, {
        padding: 50
      });
    };

    window.clearAll = function() {
      map.getSource('route').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });

      Object.values(window.waypointMarkers).forEach(marker => marker.remove());
      window.waypointMarkers = {};

      if (window.startMarker) {
        window.startMarker.remove();
        window.startMarker = null;
      }

      map.flyTo({
        center: [${userLocation?.lng || 19.9495}, ${
        userLocation?.lat || 49.2794
    }],
        zoom: 13
      });
    };

    map.addControl(new mapboxgl.NavigationControl());
  </script>
</body>
</html>
  `;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Planowanie Tras</Text>
                    <Text style={styles.subtitle}>
                        {waypoints.length > 0
                            ? `${waypoints.length} ${
                                  waypoints.length === 1
                                      ? "przystanek"
                                      : "przystanki"
                              }`
                            : "Dodaj przystanki"}
                    </Text>
                </View>
                <Pressable
                    style={styles.toggleButton}
                    onPress={() => setShowRoutePanel(!showRoutePanel)}
                >
                    <Ionicons
                        name={showRoutePanel ? "chevron-up" : "chevron-down"}
                        size={24}
                        color="#172f44"
                    />
                </Pressable>
            </View>

            {/* Route Planning Panel */}
            {showRoutePanel && (
                <View style={styles.routePanel}>
                    <View style={styles.routeCard}>
                        {/* Start Point */}
                        <View style={styles.routeItem}>
                            <View style={styles.startDot} />
                            {startPoint ? (
                                <View style={styles.locationRow}>
                                    <Text
                                        style={styles.locationName}
                                        numberOfLines={1}
                                    >
                                        {startPoint.name}
                                    </Text>
                                    <Pressable
                                        onPress={() => setStartPoint(null)}
                                        style={styles.removeIconSmall}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={18}
                                            color="#9ca3af"
                                        />
                                    </Pressable>
                                </View>
                            ) : (
                                <View style={styles.locationRow}>
                                    <Pressable
                                        style={styles.actionButtonCompact}
                                        onPress={handleUseCurrentLocation}
                                    >
                                        <Ionicons
                                            name="navigate"
                                            size={16}
                                            color="#172f44"
                                        />
                                        <Text
                                            style={
                                                styles.actionButtonTextCompact
                                            }
                                        >
                                            Moja lokalizacja
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        style={[
                                            styles.pinButtonSmall,
                                            isAddingStart &&
                                                styles.pinButtonSmallActive,
                                        ]}
                                        onPress={handleToggleAddStart}
                                    >
                                        <Ionicons
                                            name="location"
                                            size={16}
                                            color={
                                                isAddingStart
                                                    ? "#fff"
                                                    : "#172f44"
                                            }
                                        />
                                    </Pressable>
                                </View>
                            )}
                        </View>

                        {/* Waypoints */}
                        {waypoints.map((wp, index) => (
                            <View key={wp.id} style={styles.routeItem}>
                                <View style={styles.waypointNumber}>
                                    <Text style={styles.waypointNumberText}>
                                        {index + 1}
                                    </Text>
                                </View>
                                <View style={styles.locationRow}>
                                    <Text
                                        style={styles.locationName}
                                        numberOfLines={1}
                                    >
                                        {wp.name}
                                    </Text>
                                    <Pressable
                                        onPress={() =>
                                            handleRemoveWaypoint(wp.id)
                                        }
                                        style={styles.removeIconSmall}
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={16}
                                            color="#ef4444"
                                        />
                                    </Pressable>
                                </View>
                            </View>
                        ))}

                        {/* Add Waypoint */}
                        <View style={styles.routeItem}>
                            <Ionicons
                                name="add-circle-outline"
                                size={20}
                                color="#9ca3af"
                            />
                            {destination ? (
                                <View style={styles.locationRow}>
                                    <TextInput
                                        style={styles.inputCompact}
                                        placeholder="Wpisz nazwę miejsca..."
                                        placeholderTextColor="#9ca3af"
                                        value={destination}
                                        onChangeText={setDestination}
                                        onSubmitEditing={
                                            handleAddWaypointByName
                                        }
                                        autoCapitalize="none"
                                        autoFocus
                                    />
                                    <Pressable
                                        onPress={handleAddWaypointByName}
                                    >
                                        <Ionicons
                                            name="arrow-forward-circle"
                                            size={24}
                                            color="#172f44"
                                        />
                                    </Pressable>
                                </View>
                            ) : (
                                <View style={styles.locationRow}>
                                    <Pressable
                                        style={styles.actionButtonCompact}
                                        onPress={() => setDestination(" ")}
                                    >
                                        <Ionicons
                                            name="search-outline"
                                            size={16}
                                            color="#172f44"
                                        />
                                        <Text
                                            style={
                                                styles.actionButtonTextCompact
                                            }
                                        >
                                            Wpisz lokalizację
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        style={[
                                            styles.pinButtonSmall,
                                            isAddingWaypoint &&
                                                styles.pinButtonSmallActive,
                                        ]}
                                        onPress={handleToggleAddWaypoint}
                                    >
                                        <Ionicons
                                            name="location"
                                            size={16}
                                            color={
                                                isAddingWaypoint
                                                    ? "#fff"
                                                    : "#172f44"
                                            }
                                        />
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Action Buttons */}
                    {waypoints.length > 0 && (
                        <View style={styles.actionButtonsContainer}>
                            <Pressable
                                style={styles.calculateButton}
                                onPress={handleCalculateRoute}
                                disabled={isLoadingRoute}
                            >
                                {isLoadingRoute ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="navigate"
                                            size={20}
                                            color="#fff"
                                        />
                                        <Text
                                            style={styles.calculateButtonText}
                                        >
                                            Oblicz trasę
                                        </Text>
                                    </>
                                )}
                            </Pressable>
                            <Pressable
                                style={styles.clearButton}
                                onPress={handleClearAll}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={20}
                                    color="#ef4444"
                                />
                            </Pressable>
                        </View>
                    )}
                </View>
            )}

            {/* Map */}
            <WebView
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html: htmlContent }}
                style={styles.map}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={handleMapMessage}
            />

            {/* Start Navigation Button (Fixed at bottom) */}
            {waypoints.length >= 1 && (
                <View
                    style={[
                        styles.startButtonContainer,
                        {
                            paddingBottom:
                                Platform.OS === "ios" ? insets.bottom + 20 : 20,
                        },
                    ]}
                >
                    <Pressable style={styles.startButton}>
                        <Ionicons name="play-circle" size={24} color="#fff" />
                        <Text style={styles.startButtonText}>
                            Rozpocznij nawigację
                        </Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5FA",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#F5F5FA",
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#172f44",
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        color: "#6b7280",
        fontWeight: "500",
    },
    toggleButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    routePanel: {
        backgroundColor: "#F5F5FA",
        paddingHorizontal: 20,
        paddingBottom: 16,
        maxHeight: "60%",
    },
    routeCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        gap: 8,
    },
    routeItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 4,
    },
    startDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#10b981",
    },
    waypointNumber: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#ef4444",
        justifyContent: "center",
        alignItems: "center",
    },
    waypointNumberText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "700",
    },
    locationRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    locationName: {
        flex: 1,
        fontSize: 14,
        color: "#172f44",
        fontWeight: "500",
    },
    removeIconSmall: {
        padding: 4,
    },
    actionButtonCompact: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#F5F5FA",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    actionButtonTextCompact: {
        fontSize: 13,
        fontWeight: "600",
        color: "#172f44",
    },
    pinButtonSmall: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#e8f4fd",
        justifyContent: "center",
        alignItems: "center",
    },
    pinButtonSmallActive: {
        backgroundColor: "#172f44",
    },
    inputCompact: {
        flex: 1,
        fontSize: 14,
        color: "#172f44",
        fontWeight: "500",
        paddingVertical: 4,
    },
    actionButtonsContainer: {
        flexDirection: "row",
        gap: 12,
        marginTop: 4,
    },
    calculateButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#172f44",
        padding: 16,
        borderRadius: 16,
        shadowColor: "#172f44",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    calculateButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    clearButton: {
        width: 52,
        height: 52,
        backgroundColor: "#fee2e2",
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    map: {
        flex: 1,
    },
    startButtonContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
    },
    startButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: "#10b981",
        padding: 18,
        borderRadius: 20,
        shadowColor: "#10b981",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    startButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
});
