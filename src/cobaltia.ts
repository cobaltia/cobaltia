import '#lib/setup/all';
import process from 'node:process';
import { SapphireClient } from '@sapphire/framework';
import { CLIENT_OPTIONS } from '#root/config';

const client = new SapphireClient(CLIENT_OPTIONS);

try {
	await client.login();
} catch (error) {
	console.error(error);
	await client.destroy();
	process.exit(1);
}
