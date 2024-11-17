import { Listener } from '@sapphire/framework';
import { Events, type ItemPayload } from '#lib/types';

export class CorePreItemRun extends Listener<typeof Events.PreItemRun> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.PreItemRun });
	}

	public run(payload: ItemPayload) {
		const { item } = payload;

		if (item.collectible) {
			this.container.client.emit(Events.ItemDenied, 'This item is a collectible and cannot be used.', payload);
		}

		this.container.client.emit(Events.ItemAccepted, payload);
	}
}
