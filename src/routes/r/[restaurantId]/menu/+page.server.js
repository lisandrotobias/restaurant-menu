import { Redis } from 'ioredis';
import { env } from '$env/dynamic/private';

const redis = new Redis(env.REDIS_URL);
const API_URL = env.API_URL;

export async function load({ params }) {
    const { restaurantId } = params;
    
    try {
        // Try to get restaurant info from cache
        let restaurantInfo = await redis.get(`info:${restaurantId}`);
        if (!restaurantInfo) {
            const infoResponse = await fetch(`${API_URL}/restaurants/${restaurantId}`);
            restaurantInfo = await infoResponse.json();
            await redis.set(`info:${restaurantId}`, JSON.stringify(restaurantInfo));
        } else {
            restaurantInfo = JSON.parse(restaurantInfo);
        }

        // Try to get menu from cache
        let menu = await redis.get(`menu:${restaurantId}`);
        if (!menu) {
            const menuResponse = await fetch(`${API_URL}/restaurants/${restaurantId}/menu`);
            menu = await menuResponse.json();
            await redis.set(`menu:${restaurantId}`, JSON.stringify(menu));
        } else {
            menu = JSON.parse(menu);
        }

        return {
            restaurant: restaurantInfo,
            menu
        };
    } catch (error) {
        console.error('Error loading restaurant data:', error);
        throw error;
    }
} 