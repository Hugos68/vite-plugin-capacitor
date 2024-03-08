import { blue, bold } from "colorette";
import { exec as child_process_exec } from "child_process";
import { getConfig } from "./config.js";

export function log(input: string) {
	const { logging } = getConfig();
	if (!logging) {
		return;
	}
	console.log(`${blue("[vite-plugin-capacitor]")} ${bold(input)}`);
}

export function exec(command: string) {
	return new Promise((resolve, reject) => {
		const child = child_process_exec(command);
		child.addListener("error", reject);
		child.addListener("exit", resolve);
	});
}
