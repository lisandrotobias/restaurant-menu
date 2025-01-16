import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			runtime: 'edge',
			regions: ['iad1'],
			split: false
		}),
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Ignorar errores 404 para imágenes
				if (path.endsWith('.jpg') || path.endsWith('.png')) {
					return;
				}
				// Para otros errores, lanzar excepción
				throw new Error(message);
			}
		}
	}
};

export default config;
