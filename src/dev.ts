import { PluginOption } from "vite";

export function dev(): PluginOption {
    return {
        name: 'capacitor-dev',
        configureServer(server) {
            
        }
    }
}
