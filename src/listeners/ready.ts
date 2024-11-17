import { Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';

export class ReadyListener extends Listener {
	public run(client: Client) {
		const logger = this.container.logger;
		const { username, id } = client.user!;
		const commands = client.stores.get('commands');
		const listeners = client.stores.get('listeners');
		const items = client.stores.get('items');

		logger.info(`Successfully logged in as ${username} (${id})`);
		logger.info(`Loaded ${commands.size} commands`);
		logger.info(`Loaded ${listeners.size} listeners`);
		logger.info(`Loaded ${items.size} items`);
	}
}
