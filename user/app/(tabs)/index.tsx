import {
    StyleSheet,
    View,
    Pressable,
    Text,
    Animated,
    Modal,
    Vibration,
    Image,
    ScrollView,
    Platform,
} from "react-native";
import { useRef, useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useUserSocket } from "@/contexts/WebSocketContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const FAMILY_MEMBERS = [
    {
        id: "1",
        name: "Anna Kowalska",
        avatar: require("@/assets/images/profile1.png"),
        status: "online",
        location: "Tatry Wysokie",
        distance: "2.3 km",
    },
    {
        id: "2",
        name: "Jan Nowak",
        avatar: require("@/assets/images/profile2.png"),
        status: "offline",
        location: "Kraków",
        distance: "45 km",
    },
    {
        id: "3",
        name: "Maria Wiśniewska",
        avatar: require("@/assets/images/profile3.png"),
        status: "online",
        location: "Zakopane",
        distance: "1.1 km",
    },
];

export default function HomeScreen() {
    const { sendJsonMessage } = useUserSocket();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isHolding, setIsHolding] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const holdTimer = useRef<NodeJS.Timeout | null>(null);
    const vibrateInterval = useRef<NodeJS.Timeout | null>(null);

    // Uruchom pulsującą animację cienia przy starcie komponentu
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const startHold = () => {
        setIsHolding(true);

        // Animacja postępu (5 sekund)
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: false,
        }).start();

        // Animacja pulsowania
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.05,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Wibracje co 500ms
        vibrateInterval.current = setInterval(() => {
            Vibration.vibrate(100);
        }, 500);

        // Timer na 5 sekund
        holdTimer.current = setTimeout(() => {
            handleSOSComplete();
        }, 5000);
    };

    const cancelHold = () => {
        setIsHolding(false);

        // Zatrzymaj wszystkie animacje i timery
        progressAnim.stopAnimation();
        scaleAnim.stopAnimation();

        if (holdTimer.current) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
        }

        if (vibrateInterval.current) {
            clearInterval(vibrateInterval.current);
            vibrateInterval.current = null;
        }

        // Reset animacji
        Animated.parallel([
            Animated.timing(progressAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleSOSComplete = () => {
        // Zatrzymaj wibracje i animacje
        if (vibrateInterval.current) {
            clearInterval(vibrateInterval.current);
            vibrateInterval.current = null;
        }

        // Końcowa mocna wibracja
        Vibration.vibrate([0, 200, 100, 200]);
        //////////////
        // const content = {
        //     type_msg: "start_rescue",
        // };
        // sendJsonMessage(content);
        // console.log("[SOS] Wysyłanie wiadomości start_rescue:", content);
        setIsHolding(false);
        setShowSuccessModal(true);

        // Reset animacji
        progressAnim.setValue(0);
        scaleAnim.setValue(1);

        // Przejdź do ekranu śledzenia ratownika po 2 sekundach
        setTimeout(() => {
            setShowSuccessModal(false);
            router.push("/rescue-tracking");
        }, 2000);
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    const progressColor = progressAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ["#bd382f", "#ff6b6b", "#4caf50"],
    });

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: insets.top + 16,
                },
            ]}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Witaj,</Text>
                    <Text style={styles.title}>Jesteś bezpieczny</Text>
                </View>
                <Pressable style={styles.profileButton}>
                    <Ionicons name="person-circle-outline" size={40} color="#172f44" />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoIconContainer}>
                        <Ionicons name="information-circle" size={24} color="#172f44" />
                    </View>
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoTitle}>Przytrzymaj przycisk SOS</Text>
                        <Text style={styles.infoText}>
                            Aby wezwać pomoc, przytrzymaj przycisk przez 5 sekund
                        </Text>
                    </View>
                </View>

                {/* SOS Button */}
                <View style={styles.buttonContainer}>
                    <Animated.View
                        style={[
                            styles.pulsingShadow,
                            { transform: [{ scale: pulseAnim }] },
                        ]}
                    >
                        <View style={styles.radialGradientContainer}>
                            <View
                                style={[
                                    styles.radialRing,
                                    {
                                        width: 240,
                                        height: 240,
                                        borderRadius: 120,
                                        backgroundColor: "rgba(255, 255, 255, 0)",
                                    },
                                ]}
                            />
                            <View
                                style={[
                                    styles.radialRing,
                                    {
                                        width: 200,
                                        height: 200,
                                        borderRadius: 100,
                                        backgroundColor: "rgba(255, 220, 210, 0.08)",
                                    },
                                ]}
                            />
                            <View
                                style={[
                                    styles.radialRing,
                                    {
                                        width: 160,
                                        height: 160,
                                        borderRadius: 80,
                                        backgroundColor: "rgba(255, 190, 160, 0.15)",
                                    },
                                ]}
                            />
                            <View
                                style={[
                                    styles.radialRing,
                                    {
                                        width: 120,
                                        height: 120,
                                        borderRadius: 60,
                                        backgroundColor: "rgba(255, 160, 120, 0.25)",
                                    },
                                ]}
                            />
                            <View
                                style={[
                                    styles.radialRing,
                                    {
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        backgroundColor: "rgba(255, 140, 100, 0.35)",
                                    },
                                ]}
                            />
                        </View>
                    </Animated.View>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <View style={styles.outerShadow}>
                            <Pressable
                                style={styles.sosButton}
                                onPressIn={startHold}
                                onPressOut={cancelHold}
                            >
                                <View style={styles.innerShadowLight} />
                                <View style={styles.innerShadowDark} />

                                {isHolding && (
                                    <Animated.View
                                        style={[
                                            styles.progressRing,
                                            {
                                                width: progressWidth,
                                                backgroundColor: progressColor,
                                            },
                                        ]}
                                    />
                                )}
                                <LinearGradient
                                    colors={["#FFAD59", "#FF7E7B"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.sosContent}
                                >
                                    <Text style={styles.sosText}>SOS</Text>
                                    {isHolding && (
                                        <Text style={styles.holdText}>
                                            Przytrzymaj...
                                        </Text>
                                    )}
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </Animated.View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsCard}>
                    <Text style={styles.sectionTitle}>Szybkie akcje</Text>
                    <View style={styles.quickActionsGrid}>
                        <Pressable style={styles.quickActionItem}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons
                                    name="location-outline"
                                    size={24}
                                    color="#172f44"
                                />
                            </View>
                            <Text style={styles.quickActionText}>Udostępnij lokalizację</Text>
                        </Pressable>
                        <Pressable style={styles.quickActionItem}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons name="call-outline" size={24} color="#172f44" />
                            </View>
                            <Text style={styles.quickActionText}>Zadzwoń 112</Text>
                        </Pressable>
                        <Pressable style={styles.quickActionItem}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons name="map-outline" size={24} color="#172f44" />
                            </View>
                            <Text style={styles.quickActionText}>Mapa ratunkowa</Text>
                        </Pressable>
                        <Pressable style={styles.quickActionItem}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons
                                    name="medkit-outline"
                                    size={24}
                                    color="#172f44"
                                />
                            </View>
                            <Text style={styles.quickActionText}>Pierwsza pomoc</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Family Members */}
                <View style={styles.familyCard}>
                    <View style={styles.familyHeader}>
                        <Text style={styles.sectionTitle}>Lista bliskich</Text>
                        <Pressable style={styles.viewAllButton}>
                            <Text style={styles.viewAllText}>Zobacz wszystkich</Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#172f44"
                            />
                        </Pressable>
                    </View>

                    {FAMILY_MEMBERS.map((member) => (
                        <Pressable key={member.id} style={styles.familyMember}>
                            <Image source={member.avatar} style={styles.avatar} />
                            <View style={styles.memberInfo}>
                                <View style={styles.memberNameRow}>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <View
                                        style={[
                                            styles.statusDot,
                                            member.status === "online" &&
                                                styles.statusDotOnline,
                                        ]}
                                    />
                                </View>
                                <View style={styles.memberLocationRow}>
                                    <Ionicons
                                        name="location-outline"
                                        size={12}
                                        color="#6b7280"
                                    />
                                    <Text style={styles.memberLocation}>
                                        {member.location}
                                    </Text>
                                    <Text style={styles.memberDistance}>
                                        • {member.distance}
                                    </Text>
                                </View>
                            </View>
                            <Pressable style={styles.memberActionButton}>
                                <Ionicons
                                    name="chatbubble-outline"
                                    size={20}
                                    color="#172f44"
                                />
                            </Pressable>
                        </Pressable>
                    ))}
                </View>

                <View style={{ height: Platform.OS === "ios" ? 100 : 80 }} />
            </ScrollView>

            {/* Success Modal */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                        </View>
                        <Text style={styles.modalTitle}>Pomoc wezwana!</Text>
                        <Text style={styles.modalText}>
                            Ratownicy zostali powiadomieni i są w drodze
                        </Text>
                    </View>
                </View>
            </Modal>
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
        marginBottom: 16,
    },
    greeting: {
        fontSize: 16,
        color: "#6b7280",
        fontWeight: "500",
        marginBottom: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#172f44",
        letterSpacing: -0.5,
    },
    profileButton: {
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    infoCard: {
        flexDirection: "row",
        backgroundColor: "#e8f4fd",
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#d1e9f8",
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(23, 47, 68, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#172f44",
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: "#4b5563",
        lineHeight: 18,
        fontWeight: "500",
    },
    buttonContainer: {
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        marginBottom: 32,
        marginTop: 20,
    },
    pulsingShadow: {
        position: "absolute",
        width: 240,
        height: 240,
        borderRadius: 120,
    },
    radialGradientContainer: {
        width: 240,
        height: 240,
        justifyContent: "center",
        alignItems: "center",
    },
    radialRing: {
        position: "absolute",
    },
    outerShadow: {
        width: 240,
        height: 240,
        borderRadius: 120,
        shadowColor: "#FFFFFF",
        shadowOffset: {
            width: -8,
            height: -8,
        },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 8,
    },
    sosButton: {
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#AAAACC",
        shadowOffset: {
            width: 8,
            height: 8,
        },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 8,
        overflow: "hidden",
        position: "relative",
    },
    innerShadowLight: {
        position: "absolute",
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 0.5,
        borderColor: "rgba(255, 255, 255, 0.5)",
    },
    innerShadowDark: {
        position: "absolute",
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 1,
        borderColor: "rgba(170, 170, 204, 0.15)",
    },
    progressRing: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        opacity: 0.3,
        borderRadius: 120,
    },
    sosContent: {
        width: 180,
        height: 180,
        borderRadius: 90,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        shadowColor: "#AAAACC",
        shadowOffset: {
            width: 4,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    sosText: {
        color: "#FFFFFF",
        fontSize: 54,
        fontWeight: "700",
        lineHeight: 62,
        textShadowColor: "rgba(0, 0, 0, 0.15)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    holdText: {
        color: "#fff",
        fontSize: 14,
        marginTop: 4,
        opacity: 0.95,
        fontWeight: "600",
    },
    quickActionsCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#172f44",
        marginBottom: 16,
    },
    quickActionsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    quickActionItem: {
        width: "48%",
        backgroundColor: "#F5F5FA",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        gap: 8,
    },
    quickActionIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#e8f4fd",
        justifyContent: "center",
        alignItems: "center",
    },
    quickActionText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#172f44",
        textAlign: "center",
    },
    familyCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    familyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    viewAllButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#172f44",
    },
    familyMember: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: "#F0F0F5",
    },
    memberInfo: {
        flex: 1,
    },
    memberNameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    memberName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#172f44",
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#9ca3af",
    },
    statusDotOnline: {
        backgroundColor: "#10b981",
    },
    memberLocationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    memberLocation: {
        fontSize: 12,
        color: "#6b7280",
        fontWeight: "500",
    },
    memberDistance: {
        fontSize: 12,
        color: "#9ca3af",
        fontWeight: "500",
    },
    memberActionButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#e8f4fd",
        justifyContent: "center",
        alignItems: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 32,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
        minWidth: 300,
        maxWidth: 340,
        marginHorizontal: 20,
    },
    modalIconContainer: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#172f44",
        marginBottom: 8,
        textAlign: "center",
    },
    modalText: {
        fontSize: 15,
        color: "#6b7280",
        textAlign: "center",
        lineHeight: 22,
    },
});
