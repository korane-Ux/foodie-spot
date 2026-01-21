import { cache } from '@/services/cache';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

import { storage } from '@/services/storage';
import { Restaurant, SearchFilters } from '@/types';

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

export const  restaurantAPI =  {

    async getRestaurants(filters?: SearchFilters): Promise<Restaurant[]> {

        const isConnected = await checkConnection();

        if (!isConnected) {
            // log.warn('Offline: Loading cached restaurants');
            const cached = await cache.get<Restaurant[]>('restaurants');
            return cached && cached.length > 0 ? cached : mockRestaurants;
        }

        try {
            const response = await api.get('/restaurants', {params: filters});
            const restaurants = response.data?.length ? response.data : mockRestaurants;
            await cache.set('restaurants', restaurants);
            return restaurants;
        } catch (error) {
            // log.error('Failed to fetch restaurants', error);
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
       
    }

}