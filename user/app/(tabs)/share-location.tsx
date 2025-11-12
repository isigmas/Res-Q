import {
    StyleSheet,
    View,
    Text,
    Pressable,
    ScrollView,
    Platform,
    Switch,
    Image,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Circle, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from "react-native-maps";

// Mock data dla członków rodziny
const FAMILY_MEMBERS = [
    {
        id: "1",
        name: "Anna Kowalska",
        avatar: require("@/assets/images/profile1.png"),
        isSharing: true,
        lastUpdate: "2 min temu",
    },
    {
        id: "2",
        name: "Jan Nowak",
        avatar: require("@/assets/images/profile2.png"),
        isSharing: false,
        lastUpdate: "5 min temu",
    },
    {
        id: "3",
        name: "Maria Wiśniewska",
        avatar: require("@/assets/images/profile3.png"),
        isSharing: true,
        lastUpdate: "1 min temu",
    },
];

export default function ShareLocationScreen() {
    const insets = useSafeAreaInsets();
    const [isLocationSharing, setIsLocationSharing] = useState(true);
    const [shareWithFamily, setShareWithFamily] = useState(true);
    const [shareWithRescuers, setShareWithRescuers] = useState(true);

    // Mock lokalizacja użytkownika (Zakopane)
    const userLocation = {
        latitude: 49.2992,
        longitude: 19.9496,
        accuracy: 15,
    };

    const toggleLocationSharing = () => {
        setIsLocationSharing(!isLocationSharing);
    };

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
                <Text style={styles.title}>Udostępnij lokalizację</Text>
                <View style={styles.statusContainer}>
                    <View
                        style={[
                            styles.statusDot,
                            isLocationSharing && styles.statusDotActive,
                        ]}
                    />
                    <Text style={styles.statusText}>
                        {isLocationSharing ? "Aktywne" : "Nieaktywne"}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Mapa */}
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                        initialRegion={{
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }}
                        showsUserLocation={false}
                        showsMyLocationButton={false}
                        showsCompass={false}
                        toolbarEnabled={false}
                    >
                        {/* Marker użytkownika */}
                        <Marker
                            coordinate={{
                                latitude: userLocation.latitude,
                                longitude: userLocation.longitude,
                            }}
                        >
                            <View style={styles.markerContainer}>
                                <View style={styles.markerPulse} />
                                <View style={styles.markerDot} />
                            </View>
                        </Marker>

                        {/* Okrąg dokładności */}
                        <Circle
                            center={{
                                latitude: userLocation.latitude,
                                longitude: userLocation.longitude,
                            }}
                            radius={userLocation.accuracy}
                            fillColor="rgba(23, 47, 68, 0.1)"
                            strokeColor="rgba(23, 47, 68, 0.3)"
                            strokeWidth={1}
                        />
                    </MapView>

                    {/* Informacja o lokalizacji */}
                    <View style={styles.locationInfo}>
                        <View style={styles.locationInfoRow}>
                            <Ionicons
                                name="location-sharp"
                                size={16}
                                color="#172f44"
                            />
                            <Text style={styles.locationText}>
                                Zakopane, Tatry
                            </Text>
                        </View>
                        <View style={styles.locationInfoRow}>
                            <Ionicons name="navigate" size={14} color="#6b7280" />
                            <Text style={styles.accuracyText}>
                                Dokładność: {userLocation.accuracy}m
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Główny przełącznik udostępniania */}
                <View style={styles.mainControlCard}>
                    <View style={styles.controlHeader}>
                        <View style={styles.controlIconContainer}>
                            <Ionicons
                                name="share-social"
                                size={24}
                                color="#172f44"
                            />
                        </View>
                        <View style={styles.controlInfo}>
                            <Text style={styles.controlTitle}>
                                Udostępnianie lokalizacji
                            </Text>
                            <Text style={styles.controlDescription}>
                                Pozwól bliskim śledzić Twoją pozycję
                            </Text>
                        </View>
                        <Switch
                            value={isLocationSharing}
                            onValueChange={toggleLocationSharing}
                            trackColor={{ false: "#d1d5db", true: "#86d1c0" }}
                            thumbColor={isLocationSharing ? "#172f44" : "#f3f4f6"}
                            ios_backgroundColor="#d1d5db"
                        />
                    </View>
                </View>

                {/* Opcje udostępniania */}
                {isLocationSharing && (
                    <View style={styles.optionsCard}>
                        <Text style={styles.sectionTitle}>
                            Udostępnij lokalizację
                        </Text>

                        <View style={styles.optionItem}>
                            <View style={styles.optionLeft}>
                                <Ionicons
                                    name="people"
                                    size={20}
                                    color="#172f44"
                                />
                                <Text style={styles.optionText}>
                                    Rodzina i znajomi
                                </Text>
                            </View>
                            <Switch
                                value={shareWithFamily}
                                onValueChange={setShareWithFamily}
                                trackColor={{ false: "#d1d5db", true: "#86d1c0" }}
                                thumbColor={shareWithFamily ? "#172f44" : "#f3f4f6"}
                                ios_backgroundColor="#d1d5db"
                            />
                        </View>

                        <View style={styles.optionItem}>
                            <View style={styles.optionLeft}>
                                <Ionicons
                                    name="medkit"
                                    size={20}
                                    color="#172f44"
                                />
                                <Text style={styles.optionText}>
                                    Służby ratunkowe
                                </Text>
                            </View>
                            <Switch
                                value={shareWithRescuers}
                                onValueChange={setShareWithRescuers}
                                trackColor={{ false: "#d1d5db", true: "#86d1c0" }}
                                thumbColor={
                                    shareWithRescuers ? "#172f44" : "#f3f4f6"
                                }
                                ios_backgroundColor="#d1d5db"
                            />
                        </View>
                    </View>
                )}

                {/* Lista osób z dostępem */}
                {isLocationSharing && shareWithFamily && (
                    <View style={styles.familyCard}>
                        <View style={styles.familyHeader}>
                            <Text style={styles.sectionTitle}>
                                Osoby z dostępem
                            </Text>
                            <Pressable style={styles.addButton}>
                                <Ionicons
                                    name="person-add"
                                    size={18}
                                    color="#172f44"
                                />
                                <Text style={styles.addButtonText}>Dodaj</Text>
                            </Pressable>
                        </View>

                        {FAMILY_MEMBERS.map((member) => (
                            <View key={member.id} style={styles.familyMember}>
                                <Image
                                    source={member.avatar}
                                    style={styles.avatar}
                                />
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>
                                        {member.name}
                                    </Text>
                                    <View style={styles.memberStatus}>
                                        <View
                                            style={[
                                                styles.memberStatusDot,
                                                member.isSharing &&
                                                    styles.memberStatusDotActive,
                                            ]}
                                        />
                                        <Text style={styles.memberStatusText}>
                                            {member.isSharing
                                                ? `Udostępnia • ${member.lastUpdate}`
                                                : "Nie udostępnia"}
                                        </Text>
                                    </View>
                                </View>
                                <Pressable style={styles.memberAction}>
                                    <Ionicons
                                        name="ellipsis-horizontal"
                                        size={20}
                                        color="#9ca3af"
                                    />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}

                {/* Informacja o prywatności */}
                <View style={styles.privacyInfo}>
                    <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
                    <Text style={styles.privacyText}>
                        Twoja lokalizacja jest szyfrowana i widoczna tylko dla
                        wybranych osób
                    </Text>
                </View>

                <View style={{ height: Platform.OS === "ios" ? 100 : 80 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5FA",
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#172f44",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#9ca3af",
    },
    statusDotActive: {
        backgroundColor: "#10b981",
    },
    statusText: {
        fontSize: 14,
        color: "#6b7280",
        fontWeight: "500",
    },
    scrollView: {
        flex: 1,
    },
    mapContainer: {
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    map: {
        width: "100%",
        height: 300,
    },
    markerContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    markerPulse: {
        position: "absolute",
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(23, 47, 68, 0.2)",
    },
    markerDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#172f44",
        borderWidth: 3,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    locationInfo: {
        backgroundColor: "#fff",
        padding: 16,
        gap: 8,
    },
    locationInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    locationText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#172f44",
    },
    accuracyText: {
        fontSize: 13,
        color: "#6b7280",
        fontWeight: "500",
    },
    mainControlCard: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 20,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    controlHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    controlIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "#e8f4fd",
        justifyContent: "center",
        alignItems: "center",
    },
    controlInfo: {
        flex: 1,
    },
    controlTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#172f44",
        marginBottom: 2,
    },
    controlDescription: {
        fontSize: 13,
        color: "#6b7280",
        fontWeight: "500",
    },
    optionsCard: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 20,
        padding: 16,
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
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    optionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    optionText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#172f44",
    },
    familyCard: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 20,
        padding: 16,
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
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#e8f4fd",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    addButtonText: {
        fontSize: 14,
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
    memberName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#172f44",
        marginBottom: 4,
    },
    memberStatus: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    memberStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#9ca3af",
    },
    memberStatusDotActive: {
        backgroundColor: "#10b981",
    },
    memberStatusText: {
        fontSize: 12,
        color: "#6b7280",
        fontWeight: "500",
    },
    memberAction: {
        padding: 8,
    },
    privacyInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#f9fafb",
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    privacyText: {
        flex: 1,
        fontSize: 13,
        color: "#6b7280",
        lineHeight: 18,
        fontWeight: "500",
    },
});
