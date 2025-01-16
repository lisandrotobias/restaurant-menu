export async function load({ params }) {
    const { restaurantId } = params;
    const BASE_URL = 'https://pos.capybarasolutions.com/api/v1';
    
    const fetchOptions = {
        cache: 'no-store',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    };
    
    try {
        // Fetch restaurant info
        const infoResponse = await fetch(`${BASE_URL}/restaurants/${restaurantId}`, fetchOptions);
        const restaurantInfo = await infoResponse.json();

        // Fetch menu
        const menuResponse = await fetch(`${BASE_URL}/restaurants/${restaurantId}/menu`, fetchOptions);
        const menu = await menuResponse.json();

        return {
            restaurant: restaurantInfo,
            menu
        };
    } catch (error) {
        console.error('Error loading restaurant data:', error);
        throw error;
    }
} 