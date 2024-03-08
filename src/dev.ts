import type { PluginOption } from 'vite';
import type { CapacitorConfig } from '@capacitor/cli';
import ip from 'ip';
import { promises as fs } from 'fs';
import { exec, log } from './util.js';
import { detect, getCommand } from '@antfu/ni';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export function dev(): PluginOption {
	return {
		name: 'capacitor-dev',
		apply: 'serve',
		config({ server: { host, port } }) {
			const new_port = port ?? 5173;
			const new_host = typeof host === 'string' ? host : ip.address();
			return {
				server: {
					host: new_host,
					port: new_port,
				},
			};
		},
		async configResolved({ server: { https, host, port } }) {
			const url = `${https ? 'https' : 'http'}://${host}:${port}`;
			const config = await get_capacitor_config();
			await edit_config(config, url);
		},
	};
}

type Config = {
	filename: string;
	content: string;
	extension: 'ts' | 'js' | 'json';
};

async function get_capacitor_config() {
	const filenames = ['capacitor.config.ts', 'capacitor.config.js', 'capacitor.config.json'];

	const configs: Config[] = [];

	for (const filename of filenames) {
		try {
			const content = await fs.readFile(filename, 'utf-8');
			const extension = filename.split('.').at(-1);
			if (extension !== 'ts' && extension !== 'js' && extension !== 'json') {
				throw new Error(`Invalid file extension: ${extension}`);
			}
			configs.push({
				filename,
				content,
				extension,
			});
		} catch (e) {}
	}

	if (configs.length === 0) {
		throw new Error(
			`Failed to find capacitor configuration, supported files are: "capacitor.config.ts", "capacitor.config.js", "capacitor.config.json"`,
		);
	} else if (configs.length > 1) {
		const filenames = configs.map(({ filename }) => `"${filename}"`);
		throw new Error(
			`Found multiple capacitor config files: ${filenames.join(
				', ',
			)}. Please remove all but one.`,
		);
	}
	return configs[0];
}

async function edit_config(config: Config, url: string) {
	log(`Editing: "${config.filename}"...`);
	switch (config.extension) {
		case 'json': {
			const parsed: CapacitorConfig = JSON.parse(config.content);
			parsed.server.url = url;
			parsed.server.cleartext = true;
			await fs.writeFile(config.filename, JSON.stringify(parsed, null, 2));
			break;
		}
		case 'ts':
		case 'js': {
			const ast = parse(config.content, {
				sourceType: 'module',
				plugins: ['typescript'],
			});

			traverse.default(ast, {
				VariableDeclarator({ node }) {
					if (
						!('id' in node) ||
						!t.isIdentifier(node.id) ||
						node.id.name !== 'config' ||
						!('init' in node) ||
						!t.isObjectExpression(node.init)
					) {
						return;
					}
					const config = node.init;

					// Find the server property
					const server = config.properties.find(
						(p) =>
							t.isObjectProperty(p) &&
							t.isIdentifier(p.key) &&
							p.key.name === 'server',
					);

					// If it's present but not in the correct format, remove it
					if (
						server &&
						(!t.isObjectProperty(server) || !t.isObjectExpression(server.value))
					) {
						config.properties = config.properties.filter((p) => p !== server);
					}

					// If it's not present, add it
					if (!server) {
						config.properties.push(
							t.objectProperty(t.identifier('server'), t.objectExpression([])),
						);
					}

					// Ensure the server property is in the correct format
					if (!t.isObjectProperty(server) || !t.isObjectExpression(server.value)) {
						return;
					}

					server.value.properties = server.value.properties.filter(
						(p) =>
							!(
								t.isObjectProperty(p) &&
								t.isIdentifier(p.key) &&
								(p.key.name === 'url' || p.key.name === 'cleartext')
							),
					);

					// If the url property is present but not in the correct format, remove it
					server.value.properties.push(
						t.objectProperty(t.identifier('url'), t.stringLiteral(url)),
					);

					server.value.properties.push(
						t.objectProperty(t.identifier('cleartext'), t.booleanLiteral(true)),
					);
				},
			});
			const { code } = generate.default(ast);
			await fs.writeFile(config.filename, code);
			break;
		}
		default: {
			throw new Error(`Invalid file extension: ${config.extension}`);
		}
	}
	log(`Successfully edited: "${config.filename}"...`);

	log(`Syncing "${config.filename}"...`);
	const agent = await detect();
	const command = getCommand(agent, 'execute', ['cap', 'sync']);
	await exec(command);
	log(`Successfully synced "${config.filename}"...`);

	log(`Restoring config...`);
	await fs.writeFile(config.filename, config.content);
	log(`Successfully restored config...`);
}
