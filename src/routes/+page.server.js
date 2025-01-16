import { error } from '@sveltejs/kit';

export async function load() {
    const RESTAURANT_ID = '1'; // ID fijo del restaurante
    const BASE_URL = 'https://pos.capybarasolutions.com/api/v1';
    
    const fetchOptions = {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    };
    
    try {
        // Fetch restaurant info
        const infoResponse = await fetch(`${BASE_URL}/restaurants/${RESTAURANT_ID}`, fetchOptions);
        const restaurantInfo = await infoResponse.json();

        // Fetch menu
        const menuResponse = await fetch(`${BASE_URL}/restaurants/${RESTAURANT_ID}/menu`, fetchOptions);
        const menu = await menuResponse.json();

        return {
            restaurant: restaurantInfo,
            menu
        };
    } catch (err) {
        console.error('Error loading restaurant data:', err);
        throw error(500, 'Error loading restaurant data');
    }
} 