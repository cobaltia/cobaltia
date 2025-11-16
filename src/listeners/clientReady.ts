import { Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';

export class ClientReadyListener extends Listener {
	public run(client: Client) {
		const logger = this.container.logger;
		const { username, id } = client.user!;
		const commands = client.stores.get('commands');
		const listeners = client.stores.get('listeners');
		const items = client.stores.get('items');
		const apiEnabled = client.options.api?.listenOptions?.port !== undefined;

		logger.info(`Successfully logged in as ${username} (${id})`);
		logger.info(`Loaded ${commands.size} commands`);
		logger.info(`Loaded ${listeners.size} listeners`);
		logger.info(`Loaded ${items.size} items`);
		logger.info(
			apiEnabled
				? `Successfully started API on port ${client.options.api!.listenOptions?.port}`
				: `API is disabled`,
		);
	}
}
