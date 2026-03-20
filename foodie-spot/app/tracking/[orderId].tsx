import { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { Order } from "@/types";
import { orderAPI } from "@/services/api";
import { ArrowLeft, MapPin, Clock, Package, CheckCircle, Truck, ChefHat } from "lucide-react-native";

// Étapes de la timeline selon le statut
const TIMELINE_STEPS = [
    { key: 'pending', label: 'Commande reçue', icon: Package },
    { key: 'preparing', label: 'En préparation', icon: ChefHat },
    { key: 'on-the-way', label: 'En route', icon: Truck },
    { key: 'delivered', label: 'Livré', icon: CheckCircle },
];

const STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    preparing: 'En préparation',
    'on-the-way': 'En route',
    delivered: 'Livré',
    cancelled: 'Annulé',
};

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    preparing: '#3b82f6',
    'on-the-way': '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
};

export default function TrackingScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadOrder();
        // Polling toutes les 15 secondes pour suivre la progression
        intervalRef.current = setInterval(loadOrder, 15000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [orderId]);

    const loadOrder = async () => {
        try {
            const orderData = await orderAPI.getOrderById(orderId);
            setOrder(orderData);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrder();
        setRefreshing(false);
    };

    const getStepIndex = (status: string) => {
        return TIMELINE_STEPS.findIndex(s => s.key === status);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#FF6B35" />
                    <Text style={styles.loadingText}>Chargement du suivi...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Commande introuvable</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backLink}>← Retour</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const currentStepIndex = getStepIndex(order.status);
    const statusColor = STATUS_COLORS[order.status] || '#666';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Suivi commande</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Statut principal */}
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {STATUS_LABELS[order.status] || order.status}
                    </Text>
                </View>

                {/* Info commande */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>#{order.id}</Text>
                    <Text style={styles.restaurantName}>{order.restaurantName}</Text>
                    <View style={styles.infoRow}>
                        <MapPin size={16} color="#666" />
                        <Text style={styles.infoText}>{order.deliveryAddress}</Text>
                    </View>
                    {order.estimatedDeliveryTime && (
                        <View style={styles.infoRow}>
                            <Clock size={16} color="#666" />
                            <Text style={styles.infoText}>
                                Livraison estimée : {new Date(order.estimatedDeliveryTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Timeline */}
                {order.status !== 'cancelled' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Progression</Text>
                        {TIMELINE_STEPS.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            const Icon = step.icon;
                            return (
                                <View key={step.key} style={styles.timelineStep}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[
                                            styles.timelineCircle,
                                            isCompleted && styles.timelineCircleActive,
                                            isCurrent && { backgroundColor: statusColor },
                                        ]}>
                                            <Icon size={16} color={isCompleted ? '#fff' : '#ccc'} />
                                        </View>
                                        {index < TIMELINE_STEPS.length - 1 && (
                                            <View style={[
                                                styles.timelineLine,
                                                index < currentStepIndex && styles.timelineLineActive,
                                            ]} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.timelineLabel,
                                        isCompleted && styles.timelineLabelActive,
                                        isCurrent && { color: statusColor, fontWeight: '700' },
                                    ]}>
                                        {step.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Infos livreur */}
                {order.driverInfo && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Votre livreur</Text>
                        <View style={styles.driverRow}>
                            <View style={styles.driverAvatar}>
                                <Text style={styles.driverAvatarText}>
                                    {order.driverInfo.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.driverInfo}>
                                <Text style={styles.driverName}>{order.driverInfo.name}</Text>
                                <Text style={styles.driverPhone}>{order.driverInfo.phone}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Articles commandés */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Articles</Text>
                    {order.items?.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Text style={styles.itemQty}>{item.quantity}x</Text>
                            <Text style={styles.itemName}>{item.dish?.name}</Text>
                            <Text style={styles.itemPrice}>{(item.dish?.price * item.quantity).toFixed(2)} €</Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{order.total?.toFixed(2)} €</Text>
                    </View>
                </View>

                <Text style={styles.refreshHint}>↓ Tirez pour actualiser</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
    errorText: { fontSize: 16, color: '#666', marginBottom: 12 },
    backLink: { color: '#FF6B35', fontSize: 16 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    placeholder: { width: 32 },
    content: { padding: 16, gap: 16 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        padding: 12, borderRadius: 12, alignSelf: 'flex-start',
    },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusText: { fontSize: 16, fontWeight: '700' },
    card: {
        backgroundColor: '#fff', borderRadius: 16,
        padding: 16, gap: 8,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
    restaurantName: { fontSize: 18, fontWeight: '600', color: '#FF6B35' },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
    infoText: { fontSize: 14, color: '#666', flex: 1 },
    timelineStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
    timelineLeft: { alignItems: 'center', width: 32 },
    timelineCircle: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center',
    },
    timelineCircleActive: { backgroundColor: '#10b981' },
    timelineLine: { width: 2, height: 24, backgroundColor: '#e5e7eb', marginTop: 2 },
    timelineLineActive: { backgroundColor: '#10b981' },
    timelineLabel: { fontSize: 14, color: '#9ca3af', paddingTop: 6 },
    timelineLabelActive: { color: '#111827' },
    driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    driverAvatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center',
    },
    driverAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    driverInfo: { flex: 1 },
    driverName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    driverPhone: { fontSize: 14, color: '#666', marginTop: 2 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
    itemQty: { fontSize: 14, color: '#FF6B35', fontWeight: '700', width: 24 },
    itemName: { flex: 1, fontSize: 14, color: '#111827' },
    itemPrice: { fontSize: 14, color: '#666' },
    totalRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8, marginTop: 4,
    },
    totalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
    totalValue: { fontSize: 15, fontWeight: '700', color: '#FF6B35' },
    refreshHint: { textAlign: 'center', color: '#ccc', fontSize: 12, marginTop: 8 },
});