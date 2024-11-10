import { SapphireClient, container } from '@sapphire/framework';
import { CLIENT_OPTIONS } from '#root/config';
import { ItemStore } from './structures/ItemStore';

export class CobaltClient extends SapphireClient {
	public constructor() {
		super(CLIENT_OPTIONS);

		container.stores.register(new ItemStore());
	}

	public override async destroy() {
		container.logger.info('Flushing Redis...');
		await container.redis.flushall();
		container.logger.info('Destroying client...');
		await super.destroy();
	}
}
