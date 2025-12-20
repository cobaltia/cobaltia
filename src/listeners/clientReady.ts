import { Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';

export class ClientReadyListener extends Listener {
	public async run(client: Client) {
		const logger = this.container.logger;
		const { username, id } = client.user!;
		const commands = client.stores.get('commands');
		const listeners = client.stores.get('listeners');
		const items = client.stores.get('items');
		const events = client.stores.get('events');
		const apiEnabled = client.options.api?.listenOptions?.port !== undefined;
		await client.application?.emojis.fetch();

		logger.info(`Successfully logged in as ${username} (${id})`);
		logger.info(`Loaded ${commands.size} commands`);
		logger.info(`Loaded ${listeners.size} listeners`);
		logger.info(`Loaded ${items.size} items`);
		logger.info(`Loaded ${events.size} events`);
		logger.info(
			apiEnabled
				? `Successfully started API on port ${client.options.api!.listenOptions?.port}`
				: `API is disabled`,
		);
	}
}
