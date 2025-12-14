import { SapphireClient, container } from '@sapphire/framework';
import { CLIENT_OPTIONS } from '#root/config';
import { EventStore } from '#structures/EventStore';
import { ItemStore } from '#structures/ItemStore';

export class CobaltClient extends SapphireClient {
	public constructor() {
		super(CLIENT_OPTIONS);

		container.stores.register(new ItemStore());
		container.stores.register(new EventStore());
		this.on('raw', (packet: any) => container.metrics.incrementEvent({ event: packet.t }));
	}

	public override async destroy() {
		container.logger.info('Flushing Redis...');
		await container.redis.flushall();
		container.logger.info('Destroying client...');
		await super.destroy();
	}
}
