import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Pressable,
    Text,
    Alert,
    Animated,
    StyleSheet,
} from "react-native";
import * as Location from "expo-location";
import { GalileoWebSocket } from "../services/galileo";
import { LinearGradient } from "expo-linear-gradient";

const victimId = "test-victim-123";

export default function SOSButton() {
    const [isPressed, setIsPressed] = useState(false);

    // Animacja pulsującego cienia
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.6)).current;

    // Animacja obracającego się outline'u
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const outlineOpacity = useRef(new Animated.Value(0)).current;

    // Pulsowanie cienia - zawsze aktywne
    useEffect(() => {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(pulseOpacity, {
                        toValue: 0.3,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseOpacity, {
                        toValue: 0.6,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();
    }, []);

    // Animacja obracającego się outline'u podczas przytrzymywania
    useEffect(() => {
        if (isPressed) {
            // Pokaż outline
            Animated.timing(outlineOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();

            // Obracaj outline przeciwnie do ruchu wskazówek zegara
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            // Ukryj outline
            Animated.timing(outlineOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
            rotateAnim.setValue(0);
        }
    }, [isPressed]);

    const handleSOSPress = async () => {
        try {
            // Poproś o uprawnienia do lokalizacji
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Brak uprawnień", "Nie można uzyskać lokalizacji.");
                return;
            }

            // Pobierz aktualną pozycję GPS
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            // Utwórz połączenie WebSocket
            const ws = new GalileoWebSocket(victimId, () => {}, console.error);
            ws.connect();

            // Wyślij lokalizację po krótkiej chwili (żeby ws zdążył się połączyć)
            setTimeout(() => {
                ws.sendVictimLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    alt: position.coords.altitude,
                    accuracy: position.coords.accuracy ?? 0,
                    timestamp: position.timestamp,
                });
                ws.disconnect();
                Alert.alert(
                    "SOS wysłane",
                    "Twoja lokalizacja została przesłana do ratownika."
                );
            }, 500);
        } catch (error) {
            console.error("Błąd wysyłania lokalizacji SOS:", error);
            Alert.alert("Błąd", "Nie udało się wysłać lokalizacji.");
        }
    };

    // Interpolacja rotacji (przeciwnie do ruchu wskazówek zegara)
    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Wielowarstwowy pulsujący cień */}
            <Animated.View
                style={[
                    styles.pulseLayer1,
                    {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseOpacity,
                    },
                ]}
            >
                <LinearGradient
                    colors={['#ff3b30', 'rgba(255, 59, 48, 0)']}
                    style={styles.gradient}
                />
            </Animated.View>

            <Animated.View
                style={[
                    styles.pulseLayer2,
                    {
                        transform: [{ scale: Animated.multiply(pulseAnim, 0.85) }],
                        opacity: Animated.multiply(pulseOpacity, 1.2),
                    },
                ]}
            >
                <LinearGradient
                    colors={['#ff3b30', 'rgba(255, 59, 48, 0)']}
                    style={styles.gradient}
                />
            </Animated.View>

            <Animated.View
                style={[
                    styles.pulseLayer3,
                    {
                        transform: [{ scale: Animated.multiply(pulseAnim, 0.7) }],
                        opacity: Animated.multiply(pulseOpacity, 1.5),
                    },
                ]}
            >
                <LinearGradient
                    colors={['#ff3b30', 'rgba(255, 59, 48, 0)']}
                    style={styles.gradient}
                />
            </Animated.View>

            {/* Obracający się outline podczas przytrzymywania */}
            <Animated.View
                style={[
                    styles.rotatingOutline,
                    {
                        opacity: outlineOpacity,
                        transform: [{ rotate }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#ff3b30', 'rgba(255, 255, 255, 0.9)', '#ff3b30', 'rgba(255, 59, 48, 0.5)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.outlineGradient}
                />
            </Animated.View>

            <Pressable
                style={styles.button}
                onPress={handleSOSPress}
                onPressIn={() => setIsPressed(true)}
                onPressOut={() => setIsPressed(false)}
            >
                <Text style={styles.buttonText}>SOS</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 30,
        right: 20,
        width: 120,
        height: 120,
        alignItems: "center",
        justifyContent: "center",
    },
    // Wielowarstwowy pulsujący cień
    pulseLayer1: {
        width: 100,
        height: 100,
        borderRadius: 50,
        position: "absolute",
    },
    pulseLayer2: {
        width: 90,
        height: 90,
        borderRadius: 45,
        position: "absolute",
    },
    pulseLayer3: {
        width: 80,
        height: 80,
        borderRadius: 40,
        position: "absolute",
    },
    gradient: {
        width: "100%",
        height: "100%",
        borderRadius: 50,
    },
    // Obracający się outline
    rotatingOutline: {
        width: 90,
        height: 90,
        borderRadius: 45,
        position: "absolute",
    },
    outlineGradient: {
        width: "100%",
        height: "100%",
        borderRadius: 45,
        borderWidth: 3,
        borderColor: "transparent",
    },
    button: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#ff3b30",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#ff3b30",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
    },
    buttonText: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
    },
});
