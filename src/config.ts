export type CapacitorPluginConfig = {
	logging?: boolean;
};

let capacitor_plugin_config: CapacitorPluginConfig = {
	logging: true,
};

export function getConfig() {
	return capacitor_plugin_config;
}

export function setConfig(config: CapacitorPluginConfig) {
	capacitor_plugin_config = {
		...capacitor_plugin_config,
		...config,
	};
}
