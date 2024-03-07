import { SapphireClient, container } from '@sapphire/framework';
import { CLIENT_OPTIONS } from '#root/config';

export class CobaltClient extends SapphireClient {
	public constructor() {
		super(CLIENT_OPTIONS);
	}

	public override async destroy() {
		container.logger.info('Flushing Redis...');
		await container.redis.flushall();
		container.logger.info('Destroying client...');
		await super.destroy();
	}
}
