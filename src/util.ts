import { blue, bold } from "colorette";

export function log(input: string) {
	console.log(`${blue("[vite-plugin-capacitor]")} ${bold(input)}`);
}
