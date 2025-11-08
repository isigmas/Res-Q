import {
    StyleSheet,
    View,
    Text,
    TextInput,
    FlatList,
    Pressable,
    Platform,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Mock data dla pobranych map
const MOCK_MAPS = [
    {
        id: "1",
        name: "Tatry",
        region: "Tatry Wysokie",
        size: 245.8,
        downloadDate: "2025-11-05",
        coverage: "12.5 km²",
    },
    {
        id: "2",
        name: "Karkonosze",
        region: "Sudety",
        size: 312.5,
        downloadDate: "2025-11-01",
        coverage: "15.8 km²",
    },
    {
        id: "4",
        name: "Bieszczady",
        region: "Karpaty Wschodnie",
        size: 189.7,
        downloadDate: "2025-10-28",
        coverage: "9.7 km²",
    },
    {
        id: "5",
        name: "Pieniny",
        region: "Karpaty",
        size: 98.4,
        downloadDate: "2025-10-25",
        coverage: "5.3 km²",
    },
    {
        id: "6",
        name: "Gorce",
        region: "Beskidy Zachodnie",
        size: 167.2,
        downloadDate: "2025-10-20",
        coverage: "7.9 km²",
    },
];

export default function SavedMapsScreen() {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState("");
    const [maps, setMaps] = useState(MOCK_MAPS);

    // Filtrowanie map na podstawie wyszukiwania
    const filteredMaps = maps.filter(
        (map) =>
            map.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            map.region.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Oblicz całkowitą wagę map
    const totalSize = maps.reduce((sum, map) => sum + map.size, 0);

    const handleDeleteMap = (mapId: string) => {
        setMaps((prevMaps) => prevMaps.filter((map) => map.id !== mapId));
    };

    const formatSize = (size: number) => {
        return size >= 1000
            ? `${(size / 1024).toFixed(1)} GB`
            : `${size.toFixed(1)} MB`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("pl-PL", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const renderMapItem = ({ item }: { item: (typeof MOCK_MAPS)[0] }) => (
        <View style={styles.mapCard}>
            <View style={styles.mapIconContainer}>
                <Ionicons name="map" size={28} color="#172f44" />
            </View>

            <View style={styles.mapInfo}>
                <Text style={styles.mapName} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={styles.mapMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons
                            name="location-outline"
                            size={14}
                            color="#6b7280"
                        />
                        <Text style={styles.metaText}>{item.region}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons
                            name="resize-outline"
                            size={14}
                            color="#6b7280"
                        />
                        <Text style={styles.metaText}>{item.coverage}</Text>
                    </View>
                </View>
                <Text style={styles.mapDate}>
                    {formatDate(item.downloadDate)}
                </Text>
            </View>

            <View style={styles.mapActions}>
                <Text style={styles.mapSize}>{formatSize(item.size)}</Text>
                <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMap(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </Pressable>
            </View>
        </View>
    );

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: insets.top + 16,
                    paddingBottom: Platform.OS === "ios" ? 0 : 16,
                },
            ]}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Pobrane mapy</Text>
                <View style={styles.storageInfo}>
                    <Ionicons name="server-outline" size={16} color="#6b7280" />
                    <Text style={styles.storageText}>
                        Łącznie: {formatSize(totalSize)}
                    </Text>
                </View>
            </View>

            {/* Wyszukiwarka */}
            <View style={styles.searchContainer}>
                <Ionicons
                    name="search-outline"
                    size={20}
                    color="#9ca3af"
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Szukaj mapy lub regionu..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <Pressable
                        onPress={() => setSearchQuery("")}
                        style={styles.clearButton}
                    >
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color="#9ca3af"
                        />
                    </Pressable>
                )}
            </View>

            {/* Lista map */}
            {filteredMaps.length > 0 ? (
                <FlatList
                    data={filteredMaps}
                    renderItem={renderMapItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="map-outline" size={64} color="#d1d5db" />
                    <Text style={styles.emptyTitle}>
                        {searchQuery
                            ? "Nie znaleziono map"
                            : "Brak pobranych map"}
                    </Text>
                    <Text style={styles.emptyText}>
                        {searchQuery
                            ? "Spróbuj zmienić kryteria wyszukiwania"
                            : "Pobierz mapy offline, aby korzystać z nich bez internetu"}
                    </Text>
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
    storageInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    storageText: {
        fontSize: 14,
        color: "#6b7280",
        fontWeight: "500",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#1f2937",
        fontWeight: "500",
    },
    clearButton: {
        padding: 4,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    mapCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    mapIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: "#e8f4fd",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    mapInfo: {
        flex: 1,
        marginRight: 12,
    },
    mapName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#172f44",
        marginBottom: 6,
        letterSpacing: -0.2,
    },
    mapMeta: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 4,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        fontSize: 13,
        color: "#6b7280",
        fontWeight: "500",
    },
    mapDate: {
        fontSize: 12,
        color: "#9ca3af",
        fontWeight: "500",
        marginTop: 2,
    },
    mapActions: {
        alignItems: "flex-end",
        gap: 8,
    },
    mapSize: {
        fontSize: 15,
        fontWeight: "700",
        color: "#172f44",
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#fee2e2",
        justifyContent: "center",
        alignItems: "center",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#4b5563",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: "#9ca3af",
        textAlign: "center",
        lineHeight: 22,
    },
});
