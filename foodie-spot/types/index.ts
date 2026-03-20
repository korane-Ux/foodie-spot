// =============================================================
// types/index.ts
// Tous les types TypeScript partagés dans l'application
// Centralisés ici pour éviter les duplications
// =============================================================

// --- Restaurant ---

// Le temps de livraison vient de l'API sous forme {min, max}
// Avant c'était juste un number, j'ai créé une interface pour être plus précis
export interface DeliveryTime {
  min: number;
  max: number;
}

export interface OpeningHour {
  day: number;    // 0 = dimanche, 1 = lundi, etc.
  open: string;   // format "HH:MM"
  close: string;
  isClosed: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug?: string;
  cuisine: string | string[]; // l'API renvoie parfois un tableau, parfois une string
  description: string;
  image: string;
  coverImage?: string;
  rating: number;
  // CORRECTION : était "reviewsCount" dans le code original mais l'API renvoie "reviewCount"
  // Ancien code : reviewsCount: number;
  reviewCount: number;
  // CORRECTION : deliveryTime était typé 'number' mais l'API renvoie {min, max}
  // Ancien code : deliveryTime: number;
  deliveryTime: DeliveryTime | number;
  deliveryFee: number;
  minimumOrder?: number;
  freeDeliveryThreshold?: number;
  distance?: number; // calculé par l'API si on envoie lat/lng
  priceRange: number | string;
  address: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  isOpen: boolean;
  isFavorite?: boolean;
  openingHours?: OpeningHour[];
  features?: string[];
  categories?: string[];
  recentReviews?: Review[];
}

// --- Filtres recherche ---

export interface SearchFilters {
  cuisine?: string;
  priceRange?: string;
  rating?: number;
  deliveryTime?: number;
  isOpen?: boolean;
  // Ajout : support géolocalisation pour le tri par distance
  lat?: number;
  lng?: number;
  radius?: number;
}

// --- Menu / Plats ---

export interface Dish {
  id: string;
  // CORRECTION : faute de frappe dans le code original
  // Ancien code : resurantId: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  allergens?: string[];
  isAvailable: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: Dish[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // emoji
  image: string;
  restaurantCount: number;
}

// --- Panier ---

export interface CartItem {
  dish: Dish;
  quantity: number;
  options?: string[];
  specialInstructions?: string;
}

// --- Utilisateur ---

export interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  photo?: string;
  avatar?: string;
  addresses: Address[];
  // CORRECTION : était "favoriteRestaurants" manquant dans l'original
  favoriteRestaurants: string[];
  notificationsEnabled?: boolean;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
  };
  createdAt?: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  apartment?: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  instructions?: string;
  coordinates?: { latitude: number; longitude: number };
}

// --- Commandes ---

// Tous les statuts possibles d'une commande
// AJOUT : 'confirmed', 'ready', 'picked_up', 'delivering' manquaient dans l'original
// Ancien code : status: 'pending' | 'confirmed' | 'preparing' | 'on-the-way' | 'delivered' | 'cancelled';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivering'
  | 'on-the-way'
  | 'delivered'
  | 'cancelled';

export interface OrderTimelineEntry {
  status: string;
  timestamp: string;
  message: string;
}

export interface DriverInfo {
  id?: string;
  name: string;
  phone: string;
  photo?: string;
  vehicle?: string;
  rating?: number;
  location?: { latitude: number; longitude: number };
}

export interface Order {
  id: string;
  orderNumber?: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage?: string;
  restaurantPhone?: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  deliveryFee: number;
  serviceFee?: number;
  tip?: number;
  discount?: number;
  status: OrderStatus;
  createdAt: Date | string;
  updatedAt?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  deliveryAddress: string | Address;
  deliveryInstructions?: string;
  paymentMethod?: string;
  // AJOUT : timeline et driver n'étaient pas dans l'original
  timeline?: OrderTimelineEntry[];
  driver?: DriverInfo | null;
  driverInfo?: DriverInfo;
  promoApplied?: {
    code: string;
    type: string;
    discount: number;
    message: string;
  } | null;
}

// --- Avis ---

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  restaurantId: string;
  orderId?: string;
  rating: number;
  // AJOUT : sous-notes par critère (feature D)
  qualityRating?: number;
  speedRating?: number;
  presentationRating?: number;
  comment: string;
  images?: string[];
  likes?: number;
  isVerifiedPurchase?: boolean;
  createdAt: string;
}

// --- Toast ---

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

export interface ToastContextType {
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

export interface ToastStackProps {
  toasts: ToastMessage[];
}

export interface ToastItemProps {
  toast: ToastMessage;
  index: number;
}

// --- Codes promo (ajout pour feature G) ---

export interface PromoResult {
  code: string;
  discount: number | 'free_delivery';
  type: 'percent' | 'fixed' | 'delivery';
  description: string;
  minOrder: number;
  maxDiscount?: number;
  message: string;
  validUntil?: string;
}

// --- Estimation livraison (ajout pour feature J) ---

export interface DeliveryEstimate {
  distance: number;
  distanceUnit: string;
  estimatedTime: { min: number; max: number; display: string };
  deliveryFee: number;
  serviceFee: number;
  minimumOrder: number;
  freeDeliveryThreshold: number;
  isDeliveryAvailable: boolean;
  message?: string | null;
}

// --- Thème (ajout pour feature A) ---

export type ThemeMode = 'light' | 'dark' | 'system';
