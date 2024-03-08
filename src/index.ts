import type { PluginOption } from "vite";
import { dev } from "./dev.js";
import { CapacitorPluginConfig, setConfig } from "./config.js";

function capacitor_plugin(config?: CapacitorPluginConfig): PluginOption {
	setConfig(config);
	return [dev()];
}

export { capacitor_plugin as capacitor };
