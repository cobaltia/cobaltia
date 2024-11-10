import { Listener } from '@sapphire/framework';
import { type ChatInputCommandInteraction } from 'discord.js';
import { Events } from '#lib/types';

export class CorePossibleItem extends Listener<typeof Events.PossibleItem> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.PossibleItem });
	}

	public run(item: string, interaction: ChatInputCommandInteraction) {
		const { client, stores } = this.container;
		const itemStore = stores.get('items');

		const _item = itemStore.get(item);

		if (!_item) {
			client.emit(Events.UnknownItem, {
				interaction,
				context: { itemName: item },
			});
			return;
		}

		client.emit(Events.PreItemRun, { interaction, context: { itemName: item } });
	}
}
