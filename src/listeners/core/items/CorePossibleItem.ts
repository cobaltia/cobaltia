import { Listener } from '@sapphire/framework';
import { type ChatInputCommandInteraction } from 'discord.js';
import { Events } from '#lib/types';

export class CorePossibleItem extends Listener<typeof Events.PossibleItem> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.PossibleItem });
	}

	public run(itemName: string, amount: number, interaction: ChatInputCommandInteraction) {
		const { client, stores } = this.container;
		const itemStore = stores.get('items');

		const item = itemStore.get(itemName);
		console.log(itemName);
		console.log(item);

		if (!item) {
			client.emit(Events.UnknownItem, {
				interaction,
				context: { itemName, amount },
			});
			return;
		}

		if (!item.run && !item.collectible) {
			client.emit(Events.ItemError, new Error('Item has no run method'), {
				item,
				interaction,
				context: { itemName, amount },
				duration: -1,
			});
			return;
		}

		client.emit(Events.PreItemRun, { item, interaction, context: { itemName, amount } });
	}
}
