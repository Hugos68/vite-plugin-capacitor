import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { capacitor } from '../dist';

export default defineConfig({
	plugins: [sveltekit(), capacitor({ logging: false })]
});
