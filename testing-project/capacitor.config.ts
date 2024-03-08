import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'svelte.kit.capacitor',
	appName: 'Sveltekit X Capacitor',
	webDir: 'dist',
	server: {
		androidScheme: 'https'
	}
};

export default config;
