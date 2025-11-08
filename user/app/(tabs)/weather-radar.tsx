import {
    StyleSheet,
    View,
    ActivityIndicator,
    Platform,
    Text,
    Pressable,
} from "react-native";
import { WebView } from "react-native-webview";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function WeatherRadarScreen() {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);

    // Oblicz czas ostatniej aktualizacji (mockup - 3 minuty temu)
    const lastUpdateTime = "3 min temu";
    const stormETA = "45 min";

    // HTML content with embedded Windy.com API
    const windyHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            height: 100%;
            width: 100%;
            overflow: hidden;
          }
          #windy {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <div id="windy"></div>
        <script src="https://unpkg.com/leaflet@1.4.0/dist/leaflet.js"></script>
        <script src="https://api.windy.com/assets/map-forecast/libBoot.js"></script>
        <script>
          const options = {
            key: 'IEuJRU9W5Mc4VMvH3hCFWb6KcdfDLNI1',
            lat: 52.237049,
            lon: 21.017532,
            zoom: 7,
            overlay: 'rain',
          };

          windyInit(options, windyAPI => {
            const { map } = windyAPI;
            windyAPI.store.set('particlesAnim', 'off');
            windyAPI.picker.open({ lat: 52.237049, lon: 21.017532 });
          });
        </script>
      </body>
    </html>
  `;

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: insets.top,
                },
            ]}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.title}>Radar Pogodowy</Text>
                        <View style={styles.updateInfo}>
                            <Ionicons
                                name="time-outline"
                                size={14}
                                color="#6b7280"
                            />
                            <Text style={styles.updateText}>
                                Aktualizacja: {lastUpdateTime}
                            </Text>
                        </View>
                    </View>
                    <Pressable style={styles.refreshButton}>
                        <Ionicons name="refresh" size={24} color="#172f44" />
                    </Pressable>
                </View>

                {/* Storm Warning Banner */}
                <Pressable style={styles.warningBanner}>
                    <View style={styles.warningIconContainer}>
                        <Ionicons
                            name="thunderstorm"
                            size={28}
                            color="#f59e0b"
                        />
                    </View>
                    <View style={styles.warningContent}>
                        <View style={styles.warningHeader}>
                            <Text style={styles.warningTitle}>
                                Nadchodząca burza
                            </Text>
                            <View style={styles.etaBadge}>
                                <Ionicons
                                    name="time"
                                    size={14}
                                    color="#f59e0b"
                                />
                                <Text style={styles.etaText}>{stormETA}</Text>
                            </View>
                        </View>
                        <Text style={styles.warningDescription}>
                            Przewidywane silne opady i burze w Twoim regionie
                        </Text>
                        <View style={styles.warningAction}>
                            <Text style={styles.warningActionText}>
                                Kliknij aby zobaczyć więcej
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#f59e0b"
                            />
                        </View>
                    </View>
                </Pressable>
            </View>

            {/* Windy WebView */}
            <View style={styles.webviewContainer}>
                {loading && (
                    <View style={styles.loadingContainer}>
                        <View style={styles.loadingContent}>
                            <ActivityIndicator size="large" color="#172f44" />
                            <Text style={styles.loadingText}>
                                Ładowanie radaru pogodowego...
                            </Text>
                        </View>
                    </View>
                )}

                <WebView
                    source={{ html: windyHTML }}
                    style={styles.webview}
                    onLoadEnd={() => setLoading(false)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    mixedContentMode="compatibility"
                    originWhitelist={["*"]}
                    startInLoadingState={false}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5FA",
    },
    header: {
        backgroundColor: "#F5F5FA",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#172f44",
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    updateInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    updateText: {
        fontSize: 13,
        color: "#6b7280",
        fontWeight: "500",
    },
    refreshButton: {
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
    warningBanner: {
        flexDirection: "row",
        backgroundColor: "#fffbeb",
        borderRadius: 20,
        padding: 16,
        borderWidth: 2,
        borderColor: "#fef3c7",
        shadowColor: "#f59e0b",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },
    warningIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: "#fef3c7",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    warningContent: {
        flex: 1,
    },
    warningHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    warningTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#92400e",
    },
    etaBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#fef3c7",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    etaText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#f59e0b",
    },
    warningDescription: {
        fontSize: 13,
        color: "#78350f",
        marginBottom: 8,
        lineHeight: 18,
        fontWeight: "500",
    },
    warningAction: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    warningActionText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#f59e0b",
    },
    webviewContainer: {
        flex: 1,
        position: "relative",
        backgroundColor: "#fff",
    },
    webview: {
        flex: 1,
        backgroundColor: "transparent",
    },
    loadingContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#F5F5FA",
        zIndex: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingContent: {
        alignItems: "center",
        gap: 16,
    },
    loadingText: {
        fontSize: 15,
        color: "#6b7280",
        fontWeight: "500",
    },
});
