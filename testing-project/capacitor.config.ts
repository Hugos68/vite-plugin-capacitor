import type { CapacitorConfig } from '@capacitor/cli';

export const config: CapacitorConfig = {
	appId: 'svelte.kit.capacitor',
	appName: 'Sveltekit X Capacitor',
	webDir: 'dist',
	server: {
		androidScheme: 'https'
	}
};
