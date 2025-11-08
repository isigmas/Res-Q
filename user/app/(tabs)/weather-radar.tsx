import { StyleSheet, View, ActivityIndicator, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useState } from "react";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function WeatherRadarScreen() {
    const [loading, setLoading] = useState(true);

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
            overlay: 'rain', // Ustaw radar opadów jako domyślną warstwę
          };

          windyInit(options, windyAPI => {
            const { map } = windyAPI;

            // Wyłącz animacje cząsteczek
            windyAPI.store.set('particlesAnim', 'off');

            // Otwórz timeline (scroll czasowy) - pokazuje animację i możliwość przewijania czasu
            windyAPI.picker.open({ lat: 52.237049, lon: 21.017532 });
          });
        </script>
      </body>
    </html>
  `;

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title" style={styles.headerText}>
                    Radar Pogodowy
                </ThemedText>
            </View>

            <View style={styles.webviewContainer}>
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0a7ea4" />
                        <ThemedText style={styles.loadingText}>
                            Ładowanie radaru pogodowego...
                        </ThemedText>
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
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        backgroundColor: "#f5f5f5",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    headerText: {
        fontSize: 24,
        fontWeight: "bold",
    },
    webviewContainer: {
        flex: 1,
        position: "relative",
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
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        zIndex: 10,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#666",
    },
});
