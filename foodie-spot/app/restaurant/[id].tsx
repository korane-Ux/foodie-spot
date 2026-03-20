import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Share } from "react-native";
import { Dish, Restaurant } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { restaurantAPI, userAPI } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ArrowLeft, Clock, Heart, MapPin, Navigation, Phone, Share2, Star, Bike, DollarSign } from "lucide-react-native";
import { DishCard } from "@/components/dish-card";
import * as Location from 'expo-location';

// Calcul distance en km entre deux coordonnées (formule Haversine)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Estimation livraison basée sur la distance
function estimateDelivery(distanceKm: number): { time: string; cost: string } {
    const baseTime = 15; // minutes de préparation
    const timePerKm = 4; // minutes par km
    const baseFee = 1.99;
    const feePerKm = 0.5;

    const totalTime = Math.round(baseTime + distanceKm * timePerKm);
    const totalCost = baseFee + distanceKm * feePerKm;

    return {
        time: `${totalTime}-${totalTime + 10} min`,
        cost: `${totalCost.toFixed(2)} €`,
    };
}

export default function RestaurantScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [menu, setMenu] = useState<Dish[]>([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);
    const [estimate, setEstimate] = useState<{ time: string; cost: string } | null>(null);

    useEffect(() => {
        loadRestaurant();
    }, [id]);

    const loadRestaurant = async () => {
        try {
            const restaurantData = await restaurantAPI.getRestaurantById(id);
            const menuData = await restaurantAPI.getMenu(id);
            setRestaurant(restaurantData);
            setMenu(menuData);
            setIsFavorite(restaurantData?.isFavorite || false);

            // Calcul estimation livraison avec GPS
            if (restaurantData?.location?.lat && restaurantData?.location?.lng) {
                calculateEstimate(restaurantData.location.lat, restaurantData.location.lng);
            } else if (restaurantData?.distance) {
                // Fallback sur distance fournie par l'API
                const dist = parseFloat(String(restaurantData.distance));
                if (!isNaN(dist)) setEstimate(estimateDelivery(dist));
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateEstimate = async (restLat: number, restLng: number) => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setEstimate(estimateDelivery(2)); // fallback 2km
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const dist = haversineDistance(loc.coords.latitude, loc.coords.longitude, restLat, restLng);
            setEstimate(estimateDelivery(dist));
        } catch {
            setEstimate(estimateDelivery(2));
        }
    };

    const handleToggleFavorite = async () => {
        try {
            await userAPI.toggleFavorite(id);
            setIsFavorite(!isFavorite);
        } catch {
            Alert.alert("Erreur", "Impossible de mettre à jour les favoris");
        }
    };

    const handleItinerary = () => {
        if (!restaurant?.address) { Alert.alert("Adresse indisponible"); return; }
        const address = encodeURIComponent(restaurant.address);
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${address}`)
            .catch(() => Alert.alert("Erreur", "Impossible d'ouvrir Maps"));
    };

    const handleCall = () => {
        if (!restaurant?.phone) { Alert.alert("Numéro indisponible"); return; }
        Linking.openURL(`tel:${restaurant.phone}`)
            .catch(() => Alert.alert("Erreur", "Impossible de passer l'appel"));
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Découvre ${restaurant?.name} sur FoodieSpot ! ${restaurant?.cuisine} - Note: ${restaurant?.rating}/5`,
                title: restaurant?.name,
            });
        } catch {}
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#FF6B35" />
                    <Text style={styles.loadingText}>Chargement du restaurant...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!restaurant) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Restaurant introuvable</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backLink}>← Retour</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const deliveryTime = typeof restaurant.deliveryTime === 'object' && restaurant.deliveryTime !== null
        ? `${(restaurant.deliveryTime as { min: number; max: number }).min}-${(restaurant.deliveryTime as { min: number; max: number }).max}`
        : restaurant.deliveryTime;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: restaurant.image }} style={styles.image} />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleToggleFavorite}>
                            <Heart size={24} color={isFavorite ? '#FF6B35' : '#000'} fill={isFavorite ? '#FF6B35' : 'transparent'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                            <Share2 size={18} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.info}>
                    <Text style={styles.name}>{restaurant.name}</Text>
                    <Text style={styles.cuisine}>{restaurant.cuisine}</Text>

                    <View style={styles.meta}>
                        <View style={styles.metaItem}>
                            <Star size={16} color="#FFC107" fill="#FFC107" />
                            <Text style={styles.metaText}>{restaurant.rating.toFixed(1)} ({restaurant.reviewsCount})</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Clock size={16} color="#666" />
                            <Text style={styles.metaText}>{deliveryTime} min</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <MapPin size={16} color="#666" />
                            <Text style={styles.metaText}>{restaurant.distance} km</Text>
                        </View>
                    </View>

                    {/* Estimation dynamique livraison */}
                    {estimate && (
                        <View style={styles.estimateBox}>
                            <Text style={styles.estimateTitle}>📍 Estimation pour votre adresse</Text>
                            <View style={styles.estimateRow}>
                                <View style={styles.estimateItem}>
                                    <Clock size={18} color="#FF6B35" />
                                    <View>
                                        <Text style={styles.estimateLabel}>Temps estimé</Text>
                                        <Text style={styles.estimateValue}>{estimate.time}</Text>
                                    </View>
                                </View>
                                <View style={styles.estimateDivider} />
                                <View style={styles.estimateItem}>
                                    <Bike size={18} color="#FF6B35" />
                                    <View>
                                        <Text style={styles.estimateLabel}>Frais de livraison</Text>
                                        <Text style={styles.estimateValue}>{estimate.cost}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleItinerary}>
                            <Navigation size={18} color="#fff" />
                            <Text style={styles.primaryButtonText}>Itinéraire</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={handleCall}>
                            <Phone size={18} color="#666" />
                            <Text style={styles.secondaryButtonText}>Appeler</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.menu}>
                    <Text style={styles.menuTitle}>Menu</Text>
                    {menu.length === 0 ? (
                        <Text style={styles.emptyMenu}>Aucun plat disponible</Text>
                    ) : (
                        menu.map((dish) => (
                            <DishCard key={dish.id} dish={dish} onPress={() => router.push(`/dish/${dish.id}`)} />
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', marginTop: -50 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
    errorText: { fontSize: 16, color: '#666', marginBottom: 12 },
    backLink: { color: '#FF6B35', fontSize: 16 },
    imageContainer: { position: 'relative', height: 200 },
    image: { width: '100%', height: '100%' },
    backButton: {
        position: 'absolute', top: 50, left: 16,
        borderRadius: 20, backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center', padding: 8,
    },
    headerActions: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 8 },
    actionButton: {
        marginTop: 34, width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    },
    info: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    cuisine: { fontSize: 16, color: '#666', marginBottom: 12 },
    meta: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 14, color: '#666' },
    estimateBox: {
        backgroundColor: '#FFF5F2', borderRadius: 12,
        padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FFD5C2',
    },
    estimateTitle: { fontSize: 13, fontWeight: '700', color: '#FF6B35', marginBottom: 12 },
    estimateRow: { flexDirection: 'row', alignItems: 'center' },
    estimateItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    estimateDivider: { width: 1, height: 36, backgroundColor: '#FFD5C2', marginHorizontal: 12 },
    estimateLabel: { fontSize: 11, color: '#999' },
    estimateValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
    actions: { flexDirection: 'row', gap: 12 },
    primaryButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        backgroundColor: '#FF6B35', borderRadius: 12, padding: 12,
    },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    secondaryButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12,
    },
    secondaryButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
    menu: { padding: 16 },
    menuTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    emptyMenu: { color: '#999', textAlign: 'center', padding: 20 },
});