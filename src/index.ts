import type { PluginOption } from "vite";
import { dev } from "./dev.js";
import { build } from "./build.js";

export function capacitor(): PluginOption {
	return [dev(), build()]
}


