import React, { useState, useRef, useEffect } from "react";
import {
    StyleSheet,
    View,
    TextInput,
    Pressable,
    Alert,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { IconSymbol } from "@/components/ui/icon-symbol";

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
            Alert.alert("Error", "Please enter a location");
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
                Alert.alert("Error", "Location not found");
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
            Alert.alert("Error", "Failed to add location");
        }
    };

    const handleMapMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === "mapClick" && isAddingStart) {
                const newStart: Waypoint = {
                    id: "start",
                    name: "Start Point",
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
                    name: `Point ${waypoints.length + 1}`,
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
            Alert.alert("Error", "Unable to get your current location");
            return;
        }

        const currentStart: Waypoint = {
            id: "start",
            name: "My Location",
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
        const routeStart = startPoint || (userLocation ? {
            id: "current",
            name: "Current Location",
            lng: userLocation.lng,
            lat: userLocation.lat,
        } : null);

        if (!routeStart) {
            Alert.alert("Error", "Please set a start point or enable location");
            return;
        }

        if (waypoints.length === 0) {
            Alert.alert("Error", "Please add at least one destination");
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
                Alert.alert("Error", "No route found");
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
            Alert.alert("Error", "Failed to calculate route");
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
      center: [${userLocation?.lng || 19.9495}, ${userLocation?.lat || 49.2794}],
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
      new mapboxgl.Marker({ color: '#0a7ea4' })
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
          'line-color': '#DC2626',
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
      window.startMarker = new mapboxgl.Marker({ color: '#00AA00' })
        .setLngLat([start.lng, start.lat])
        .setPopup(new mapboxgl.Popup().setText(start.name))
        .addTo(map);

      map.flyTo({
        center: [start.lng, start.lat],
        zoom: 14
      });
    };

    window.addWaypointMarker = function(waypoint) {
      const marker = new mapboxgl.Marker({ color: '#FFA500' })
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
        center: [${userLocation?.lng || 19.9495}, ${userLocation?.lat || 49.2794}],
        zoom: 13
      });
    };

    map.addControl(new mapboxgl.NavigationControl());
  </script>
</body>
</html>
  `;

    return (
        <ThemedView style={styles.container}>
            {/* Route Planning Box */}
            <View style={styles.routeBox}>
                {/* Start Point Row */}
                <View style={styles.routeRow}>
                    <View style={styles.iconDot}>
                        <View style={styles.startDot} />
                    </View>
                    {startPoint ? (
                        <Pressable
                            style={styles.locationButton}
                            onPress={() => setStartPoint(null)}
                        >
                            <ThemedText style={styles.locationText} numberOfLines={1}>
                                {startPoint.name}
                            </ThemedText>
                            <IconSymbol size={18} name="xmark.circle.fill" color="#999" />
                        </Pressable>
                    ) : (
                        <>
                            <Pressable
                                style={styles.locationButton}
                                onPress={handleUseCurrentLocation}
                            >
                                <IconSymbol size={18} name="location.fill" color="#0a7ea4" />
                                <ThemedText style={styles.locationText}>My Location</ThemedText>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.pinIconButton,
                                    isAddingStart && styles.pinIconButtonActive,
                                ]}
                                onPress={handleToggleAddStart}
                            >
                                <IconSymbol
                                    size={20}
                                    name="mappin.circle.fill"
                                    color={isAddingStart ? "#DC2626" : "#666"}
                                />
                            </Pressable>
                        </>
                    )}
                </View>

                {/* Waypoints */}
                {waypoints.map((wp, index) => (
                    <View key={wp.id} style={styles.routeRow}>
                        <View style={styles.iconDot}>
                            <ThemedText style={styles.waypointNumber}>
                                {index + 1}
                            </ThemedText>
                        </View>
                        <View style={styles.locationButton}>
                            <ThemedText style={styles.locationText} numberOfLines={1}>
                                {wp.name}
                            </ThemedText>
                        </View>
                        <Pressable
                            style={styles.removeButton}
                            onPress={() => handleRemoveWaypoint(wp.id)}
                        >
                            <IconSymbol size={18} name="xmark.circle.fill" color="#999" />
                        </Pressable>
                    </View>
                ))}

                {/* Add Destination Row */}
                <View style={styles.routeRow}>
                    <View style={styles.iconDot}>
                        <IconSymbol size={16} name="plus.circle.fill" color="#0a7ea4" />
                    </View>
                    {destination ? (
                        <>
                            <TextInput
                                style={styles.destinationInput}
                                placeholder="Enter destination"
                                placeholderTextColor="#999"
                                value={destination}
                                onChangeText={setDestination}
                                onSubmitEditing={handleAddWaypointByName}
                                autoCapitalize="none"
                            />
                            <Pressable
                                style={styles.addDestButton}
                                onPress={handleAddWaypointByName}
                            >
                                <IconSymbol size={20} name="arrow.right.circle.fill" color="#0a7ea4" />
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Pressable
                                style={styles.locationButton}
                                onPress={() => {
                                    // Focus input by setting a space and clearing it
                                    setDestination(" ");
                                    setTimeout(() => setDestination(""), 10);
                                }}
                            >
                                <ThemedText style={styles.addDestText}>
                                    Add destination
                                </ThemedText>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.pinIconButton,
                                    isAddingWaypoint && styles.pinIconButtonActive,
                                ]}
                                onPress={handleToggleAddWaypoint}
                            >
                                <IconSymbol
                                    size={20}
                                    name="mappin.circle.fill"
                                    color={isAddingWaypoint ? "#DC2626" : "#666"}
                                />
                            </Pressable>
                        </>
                    )}
                </View>

                {/* Calculate Route Button */}
                {waypoints.length > 0 && (
                    <View style={styles.actionButtons}>
                        <Pressable
                            style={styles.calculateButton}
                            onPress={handleCalculateRoute}
                            disabled={isLoadingRoute}
                        >
                            {isLoadingRoute ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <ThemedText style={styles.calculateButtonText}>
                                    Calculate Route
                                </ThemedText>
                            )}
                        </Pressable>
                        <Pressable
                            style={styles.clearAllButton}
                            onPress={handleClearAll}
                        >
                            <IconSymbol size={20} name="trash" color="#DC2626" />
                        </Pressable>
                    </View>
                )}
            </View>

            {/* Map */}
            <WebView
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html: htmlContent }}
                style={styles.map}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={handleMapMessage}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error("WebView error: ", nativeEvent);
                }}
                onLoadEnd={() => {
                    console.log("WebView loaded successfully");
                }}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    routeBox: {
        position: "absolute",
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        zIndex: 10,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    routeRow: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 48,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
        paddingVertical: 4,
    },
    iconDot: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    startDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#00AA00",
    },
    waypointNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#0a7ea4",
        color: "#fff",
        textAlign: "center",
        lineHeight: 24,
        fontWeight: "bold",
        fontSize: 13,
    },
    locationButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 8,
    },
    locationText: {
        fontSize: 15,
        flex: 1,
    },
    addDestText: {
        fontSize: 15,
        color: "#666",
    },
    pinIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 4,
    },
    pinIconButtonActive: {
        backgroundColor: "#FFE5E5",
    },
    destinationInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 8,
        color: "#000",
    },
    addDestButton: {
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
    },
    removeButton: {
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 4,
    },
    actionButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    calculateButton: {
        flex: 1,
        height: 44,
        backgroundColor: "#0a7ea4",
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    calculateButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    clearAllButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
    },
    map: {
        flex: 1,
    },
});
