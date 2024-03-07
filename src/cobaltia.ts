import '#lib/setup/all';
import process from 'node:process';
import { CobaltClient } from '#lib/CobaltClient';

const client = new CobaltClient();

try {
	await client.login();
} catch (error) {
	console.error(error);
	await client.destroy();
	process.exit(1);
}

process.on('SIGINT', async () => {
	await client.destroy();
	process.exit(0);
});
