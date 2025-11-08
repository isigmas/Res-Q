// src/components/LocationDisplay.tsx

import React from "react";
import {
    ActivityIndicator,
    Button,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ReadyState } from "react-use-websocket";
import { useUserSocket } from "../contexts/WebSocketContext";

// Funkcja pomocnicza do renderowania statusu połączenia

const renderConnectionStatus = (readyState: ReadyState) => {
    let statusText: string;
    let statusColor: string;

    switch (readyState) {
        case ReadyState.OPEN:
            statusText = "Połączono";
            statusColor = "#4CAF50"; // Zielony
            break;
        case ReadyState.CONNECTING:
            statusText = "Łączenie...";
            statusColor = "#FFC107"; // Bursztynowy
            break;
        case ReadyState.CLOSED:
            statusText = "Rozłączono";
            statusColor = "#F44336"; // Czerwony
            break;
        case ReadyState.CLOSING:
            statusText = "Zamykanie...";
            statusColor = "#FF9800"; // Pomarańczowy
            break;
        default:
            statusText = "Nieznany";
            statusColor = "#9E9E9E"; // Szary
    }

    return (
        <View style={styles.statusRow}>
            <View
                style={[
                    styles.statusIndicator,
                    { backgroundColor: statusColor },
                ]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
            </Text>
        </View>
    );
};

export const LocationDisplay = () => {
    const { readyState, rescuerLocation, sendJsonMessage } = useUserSocket();

    const handleSendTestMessage = () => {
        console.log("Wysyłanie testowej wiadomości PING...");
        sendJsonMessage({
            type: "PING",
            payload: { clientTime: Date.now() },
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Status Połączenia WebSocket</Text>
            {/* Tutaj jest ready state czyli status połączenia z websocketem */}
            {renderConnectionStatus(readyState)}
            <View style={styles.separator} />
            <Text style={styles.header}>Lokalizacja Ratownika</Text>
            {/* Wyświetlanie `rescuerLocation` */}
            {readyState === ReadyState.CONNECTING && !rescuerLocation && (
                <ActivityIndicator
                    size="large"
                    color="#007AFF"
                    style={styles.loader}
                />
            )}
            {readyState === ReadyState.CLOSED && (
                <Text style={styles.infoText}>
                    Połączenie zamknięte. Nie można odebrać danych.
                </Text>
            )}
            {readyState === ReadyState.OPEN && !rescuerLocation && (
                <Text style={styles.infoText}>
                    Połączono. Oczekiwanie na dane - lokalizację ratownika...
                </Text>
            )}
            {/* Sprawdzamy, czy mamy dane do wyświetlenia */}
            {rescuerLocation && rescuerLocation.data && (
                <View style={styles.dataContainer}>
                    <Text style={styles.header}>Odebrana Lokalizacja:</Text>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Szerokość (Lat):</Text>
                        <Text style={styles.dataValue}>
                            {rescuerLocation.data.latitude}
                        </Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Długość (Lng):</Text>
                        <Text style={styles.dataValue}>
                            {rescuerLocation.data.longitude}
                        </Text>
                    </View>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Wysokość (Alt):</Text>
                        <Text style={styles.dataValue}>
                            {rescuerLocation.data.altitude !== null
                                ? `${rescuerLocation.data.altitude.toFixed(2)} m`
                                : "N/A"}
                        </Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Dokładność:</Text>
                        <Text style={styles.dataValue}>
                            {rescuerLocation.data.accuracy.toFixed(2)} m
                        </Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Znacznik czasu:</Text>
                        <Text style={styles.dataValue}>
                            {new Date(rescuerLocation.data.timestamp).toLocaleString(
                                "pl-PL"
                            )}
                        </Text>
                    </View>
                </View>
            )}
            <View style={styles.separator} />

            {/* --- 3. Demonstracja `sendJsonMessage` --- */}
            <Button
                title="Wyślij Testowy PING"
                onPress={handleSendTestMessage}
                // Przycisk jest aktywny tylko po połączeniu
                disabled={readyState !== ReadyState.OPEN}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "90%",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    header: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    statusText: {
        fontSize: 16,
        fontWeight: "500",
    },
    separator: {
        height: 1,
        backgroundColor: "#E0E0E0",
        marginVertical: 20,
    },
    dataContainer: {
        paddingHorizontal: 10,
    },
    dataRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    dataLabel: {
        fontSize: 15,
        color: "#666",
    },
    dataValue: {
        fontSize: 15,
        fontWeight: "600",
        color: "#000",
        fontFamily: "monospace",
    },
    loader: {
        marginVertical: 20,
    },
    infoText: {
        fontSize: 15,
        color: "#666",
        textAlign: "center",
        fontStyle: "italic",
        marginVertical: 10,
    },
});
