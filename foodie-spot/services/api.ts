import { cache } from '@/services/cache';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

import { storage, STORAGE_KEYS } from '@/services/storage';
import { Dish, Order, Restaurant, SearchFilters, User } from '@/types';
import log from './logger';




const api = axios.create({
    baseURL: 'https://api.example.com',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(
    async requestConfig => {
        const token = await storage.getItem('token');
        if (token) {
            requestConfig.headers.Authorization = `Bearer ${token}`;
        }

        return requestConfig;
    },
    error => Promise.reject(error)
);

api.interceptors.response.use(
    response => response,
    async error => {
        if (error.response && error.response.status === 401) {
            await storage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

const checkConnection = async () => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
}



// Mock data for testing
const mockRestaurants: Restaurant[] = [
    {
        id: 'r1',
        name: 'Bistro Parisien',
        cuisine: 'Française',
        description: 'Cuisine bistronomique et produit frais',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        rating: 4.8,
        reviewsCount: 320,
        deliveryTime: 30,
        distance: 1.2,
        priceRange: '€€€',
        address: '12 rue de Rivoli, Paris, France',
        phone: '+33 1 23 45 67 89',
        coordinates: {
            latitude: 48.8566,
            longitude: 2.3522,
        },
        isOpen: true,
        isFavorite: false,
    },
    {
        id: 'r2',
        name: 'Tokyo Roll',
        cuisine: 'Sushi',
        description: 'Sushi rools, poke bowls et specialités japonaises',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        rating: 4.8,
        reviewsCount: 320,
        deliveryTime: 30,
        distance: 1.2,
        priceRange: '€€€',
        address: '12 rue de Rivoli, Paris, France',
        phone: '+33 1 23 45 67 89',
        coordinates: {
            latitude: 48.8566,
            longitude: 2.3522,
        },
        isOpen: true,
        isFavorite: false,
    }

];

const mockMenus: Record<string, Dish[]> = {
    r1: [
        // Entrées
        {
            id: 'd1',
            resurantId: 'r1',
            name: 'Soupe à l\'Oignon',
            description: 'Soupe à l\'oignon gratinée au fromage',
            price: 8.50,
            image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=2071&auto=format&fit=crop',
            category: 'Entrées',
            isAvailable: true,
        },
        {
            id: 'd2',
            resurantId: 'r1',
            name: 'Escargots de Bourgogne',
            description: '6 escargots au beurre persillé',
            price: 12.00,
            image: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?q=80&w=2070&auto=format&fit=crop',
            category: 'Entrées',
            isAvailable: true,
        },
        {
            id: 'd3',
            resurantId: 'r1',
            name: 'Salade Niçoise',
            description: 'Salade composée, thon, œufs, anchois, olives',
            price: 11.50,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop',
            category: 'Entrées',
            isAvailable: true,
        },

        // Plats
        {
            id: 'd4',
            resurantId: 'r1',
            name: 'Boeuf Bourguignon',
            description: 'Boeuf mijoté au vin rouge avec légumes de saison',
            price: 18.50,
            image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=2070&auto=format&fit=crop',
            category: 'Plats',
            isAvailable: true,
        },
        {
            id: 'd5',
            resurantId: 'r1',
            name: 'Coq au Vin',
            description: 'Poulet fermier mijoté au vin rouge, lardons et champignons',
            price: 16.50,
            image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=2070&auto=format&fit=crop',
            category: 'Plats',
            isAvailable: true,
        },
        {
            id: 'd6',
            resurantId: 'r1',
            name: 'Magret de Canard',
            description: 'Magret rôti, sauce aux fruits rouges, gratin dauphinois',
            price: 19.00,
            image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?q=80&w=2076&auto=format&fit=crop',
            category: 'Plats',
            isAvailable: true,
        },
        {
            id: 'd7',
            resurantId: 'r1',
            name: 'Steak Frites',
            description: 'Entrecôte grillée 300g, sauce au poivre, frites maison',
            price: 22.00,
            image: 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=2071&auto=format&fit=crop',
            category: 'Plats',
            isAvailable: true,
        },

        // Desserts
        {
            id: 'd8',
            resurantId: 'r1',
            name: 'Tarte Tatin',
            description: 'Tarte aux pommes caramélisées, servie tiède',
            price: 7.00,
            image: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?q=80&w=2070&auto=format&fit=crop',
            category: 'Desserts',
            isAvailable: true,
        },
        {
            id: 'd9',
            resurantId: 'r1',
            name: 'Crème Brûlée',
            description: 'Crème vanillée avec sa croûte caramélisée craquante',
            price: 6.50,
            image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=2070&auto=format&fit=crop',
            category: 'Desserts',
            isAvailable: true,
        },
        {
            id: 'd10',
            resurantId: 'r1',
            name: 'Mousse au Chocolat',
            description: 'Mousse onctueuse au chocolat noir 70%',
            price: 6.00,
            image: 'https://images.unsplash.com/photo-1541599468348-e96984315921?q=80&w=2070&auto=format&fit=crop',
            category: 'Desserts',
            isAvailable: true,
        },
        {
            id: 'd11',
            resurantId: 'r1',
            name: 'Profiteroles',
            description: 'Choux garnis de glace vanille, sauce chocolat chaud',
            price: 7.50,
            image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=2070&auto=format&fit=crop',
            category: 'Desserts',
            isAvailable: true,
        },
    ],

    r2: [
        // Entrées
        {
            id: 'd12',
            resurantId: 'r2',
            name: 'Edamame',
            description: 'Fèves de soja vapeur légèrement salées',
            price: 5.00,
            image: 'https://images.unsplash.com/photo-1583933378650-4e4e3fbc8b0b?q=80&w=2070&auto=format&fit=crop',
            category: 'Entrées',
            isAvailable: true,
        },
        {
            id: 'd13',
            resurantId: 'r2',
            name: 'Salade Wakame',
            description: 'Salade d\'algues marines, sauce sésame',
            price: 6.50,
            image: 'https://images.unsplash.com/photo-1604908815774-0bcb28088e0a?q=80&w=2070&auto=format&fit=crop',
            category: 'Entrées',
            isAvailable: true,
        },
        {
            id: 'd14',
            resurantId: 'r2',
            name: 'Gyoza',
            description: '6 raviolis japonais porc et légumes, poêlés',
            price: 7.50,
            image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=2070&auto=format&fit=crop',
            category: 'Entrées',
            isAvailable: true,
        },

        // Sushi
        {
            id: 'd15',
            resurantId: 'r2',
            name: 'California Roll',
            description: 'Rouleau de sushi avec crabe, avocat et concombre',
            price: 12.00,
            image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=2127&auto=format&fit=crop',
            category: 'Sushi',
            isAvailable: true,
        },
        {
            id: 'd16',
            resurantId: 'r2',
            name: 'Sushi Mix',
            description: 'Assortiment de 12 sushis et makis variés',
            price: 18.00,
            image: 'https://images.unsplash.com/photo-1564489563601-c53cfc451e93?q=80&w=2073&auto=format&fit=crop',
            category: 'Sushi',
            isAvailable: true,
        },
        {
            id: 'd17',
            resurantId: 'r2',
            name: 'Sashimi Saumon',
            description: '8 tranches de saumon frais',
            price: 15.00,
            image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?q=80&w=2070&auto=format&fit=crop',
            category: 'Sushi',
            isAvailable: true,
        },
        {
            id: 'd18',
            resurantId: 'r2',
            name: 'Dragon Roll',
            description: 'Tempura crevette, avocat, anguille grillée',
            price: 14.50,
            image: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?q=80&w=2008&auto=format&fit=crop',
            category: 'Sushi',
            isAvailable: true,
        },

        // Poke Bowls
        {
            id: 'd19',
            resurantId: 'r2',
            name: 'Poke Bowl Saumon',
            description: 'Riz, saumon mariné, avocat, edamame, concombre, sauce soja',
            price: 14.00,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop',
            category: 'Poke Bowls',
            isAvailable: true,
        },
        {
            id: 'd20',
            resurantId: 'r2',
            name: 'Poke Bowl Thon',
            description: 'Riz, thon mariné, mangue, radis, chou rouge, sauce ponzu',
            price: 15.00,
            image: 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?q=80&w=2070&auto=format&fit=crop',
            category: 'Poke Bowls',
            isAvailable: true,
        },
        {
            id: 'd21',
            resurantId: 'r2',
            name: 'Poke Bowl Veggie',
            description: 'Riz, tofu grillé, avocat, algues, graines de sésame',
            price: 12.00,
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
            category: 'Poke Bowls',
            isAvailable: true,
        },
        {
            id: 'd22',
            resurantId: 'r2',
            name: 'Poke Bowl Mix',
            description: 'Riz, saumon et thon, avocat, concombre, sauce teriyaki',
            price: 16.00,
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2087&auto=format&fit=crop',
            category: 'Poke Bowls',
            isAvailable: true,
        },

        // Desserts
        {
            id: 'd23',
            resurantId: 'r2',
            name: 'Mochi Glacé',
            description: 'Assortiment de 3 mochis glacés (vanille, thé vert, fraise)',
            price: 6.00,
            image: 'https://images.unsplash.com/photo-1582716401301-b2407dc7563d?q=80&w=2070&auto=format&fit=crop',
            category: 'Desserts',
            isAvailable: true,
        },
        {
            id: 'd24',
            resurantId: 'r2',
            name: 'Dorayaki',
            description: 'Pancakes japonais fourrés à la pâte de haricots rouges',
            price: 5.50,
            image: 'https://images.unsplash.com/photo-1605794138235-fc0249b3a711?q=80&w=2070&auto=format&fit=crop',
            category: 'Desserts',
            isAvailable: true,
        },
    ]
};

const mockOrders: Order[] = [
    {
        id: 'o1',
        restaurantId: 'r1',
        restaurantName: 'Bistro Parisien',
        items: [
            {
                dish: mockMenus['r1'][0],
                quantity: 2,
            },
            { dish: mockMenus['r1'][3], quantity: 1 },
        ],
        total: 35.00,
        deliveryFee: 3.50,
        status: 'delivered',
        createdAt: new Date(Date.now() - 86400 * 1000),
        estimatedDeliveryTime: new Date(Date.now() - 3600 * 1000),
        deliveryAddress: '15 avenue des Champs-Élysées, Paris, France',
        driverInfo: {
            name: 'Jean Dupont',
            phone: '+33 6 12 34 56 78',
            photo: 'https://randomuser.me/api/portraits/men/32.jpg',
        },
    },
    {
        id: 'o2',
        restaurantId: 'r2',
        restaurantName: 'Tokyo Roll',
        items: [
            {
                dish: mockMenus['r2'][0],
                quantity: 1,
            },
            { dish: mockMenus['r2'][4], quantity: 1 },
        ],
        total: 26.00,
        deliveryFee: 3.50,
        status: 'on-the-way',
        createdAt: new Date(Date.now() - 7200 * 1000),
        estimatedDeliveryTime: new Date(Date.now() + 1800 * 1000),
        deliveryAddress: '15 avenue des Champs-Élysées, Paris, France',
        driverInfo: {
            name: 'Sophie Martin',
            phone: '+33 6 87 65 43 21',
            photo: 'https://randomuser.me/api/portraits/women/44.jpg',
        },
    }
];

// APIs
export const restaurantAPI = {

    async getRestaurants(filters?: SearchFilters): Promise<Restaurant[]> {

        const isConnected = await checkConnection();

        if (!isConnected) {
            log.warn('Offline: Loading cached restaurants');
            const cached = await cache.get<Restaurant[]>('restaurants');
            return cached && cached.length > 0 ? cached : mockRestaurants;
        }

        try {
            const response = await api.get('/restaurants', { params: filters });
            const restaurants = response.data?.length ? response.data : mockRestaurants;
            await cache.set('restaurants', restaurants);
            return restaurants;
        } catch (error) {
            log.error('Failed to fetch restaurants', error);
            const cached = await cache.get<Restaurant[]>('restaurants');
            return cached && cached.length > 0 ? cached : mockRestaurants;
        }
    },
    async searchRestaurants(query: string): Promise<Restaurant[]> {
        try {

            const filteredRestaurants = mockRestaurants.filter(restaurant => restaurant.name.toLowerCase().includes(query.toLowerCase()));
            return filteredRestaurants;

            // const response = await api.get('/restaurants/search', { params: { q: query } });
            // return response.data;
        } catch (error) {
            // log.error('Failed to search restaurants', error);
            return [];
        }

    },
    async getRestaurantById(id: string): Promise<Restaurant | null> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            const cached = await cache.get<Restaurant>(`restaurant_${id}`);
            return cached;
        }

        try {
            const response = await api.get(`/restaurants/${id}`);
            const restaurant = response.data || mockRestaurants.find(r => r.id === id);
            if (restaurant) {
                await cache.set(`restaurant_${id}`, restaurant);
            }
            return restaurant || null;

        } catch (error) {
            // log.error(`Failed to fetch restaurant ${id}`, error);
            return (await cache.get<Restaurant>(`restaurant_${id}`)) || mockRestaurants.find(r => r.id === id) || null;
        }

    },
    async getMenu(restaurantId: string): Promise<Dish[]> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            const cached = await cache.get<Dish[]>(`menu_${restaurantId}`);
            return cached || [];
        }

        try {
            const response = await api.get(`/restaurants/${restaurantId}/menu`);
            const menu = response.data?.length ? response.data : mockMenus[restaurantId] || [];
            await cache.set(`menu_${restaurantId}`, menu);
            return menu;
        } catch (error) {
            log.error(`Failed to fetch menu for restaurant ${restaurantId}`, error);
            const cached = await cache.get<Dish[]>(`menu_${restaurantId}`);
            return (cached && cached.length > 0) ? cached : mockMenus[restaurantId] || [];
        }
    }
}

export const userAPI = {

    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, token } = response.data;
            await storage.setItem(STORAGE_KEYS.USER, user);
            await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            log.info('User logged in successfully');
            return { user, token };
     } catch (error) {
            log.error('Login failed', error);
            throw error;
        }
    },

    async getCurrentUser(): Promise<User | null> {
        return await storage.getItem(STORAGE_KEYS.USER);
    },
    async toggleFavorite(restaurantId: string) {
    },
    async updateProfile(updates: Partial<User>): Promise<User> {
        try {
            const response = await api.patch('/user/profile', updates);
            const user = response.data;
            await storage.setItem(STORAGE_KEYS.USER, user);
            return user;
        } catch (error) {
            log.error('Failed to update profile', error);
            throw error;
        }
    },
    async logout(): Promise<void> {
        await storage.removeItem(STORAGE_KEYS.USER);
        await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await cache.clearAll();
        log.info('User logged out, cache cleared');
    }

}


export const orderAPI = {
    async getOrders(): Promise<Order[]> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            const cached = await cache.get<Order[]>('orders');
            return cached && cached.length > 0 ? cached : mockOrders;
        }

        try {
            const response = await api.get('/orders');
            const orders = response.data?.length ? response.data : mockOrders;
            await cache.set('orders', orders);
            return orders;
        } catch (error) {
            // log.error('Failed to fetch orders', error);
            const cached = await cache.get<Order[]>('orders');
            return cached && cached.length > 0 ? cached : mockOrders;
        }
    },
    async getOrderById(id: string): Promise<Order | null> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            const cached = await cache.get<Order>(`order_${id}`);
            return cached || null;
        }

        try {
            const response = await api.get(`/orders/${id}`);
            const order = response.data || mockOrders.find(o => o.id === id);
            if (order) {
                await cache.set(`order_${id}`, order);
            }
            return order || null;
        } catch (error) {
            // log.error(`Failed to fetch order ${id}`, error);
            return (await cache.get<Order>(`order_${id}`)) || mockOrders.find(o => o.id === id) || null;
        }
    },
}

export const uploadAPI = {
    async uploadImage(uri: string, type: 'profile' | 'review'): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('image', {
                uri,
                name: `${type}_${Date.now()}.jpg`,
                type: 'image/jpeg',
            } as any);

            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data.url;

        } catch (error) {
            log.error('Failed to upload image', error);
            throw error;
        }
    }
}