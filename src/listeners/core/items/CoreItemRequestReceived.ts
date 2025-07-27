import { Listener } from '@sapphire/framework';
import { type ChatInputCommandInteraction } from 'discord.js';
import { Events } from '#lib/types';

export class CoreItemRequestReceived extends Listener<typeof Events.ItemRequestReceived> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.ItemRequestReceived });
	}

	public run(itemName: string, amount: number, interaction: ChatInputCommandInteraction) {
		const { client, stores } = this.container;
		const itemStore = stores.get('items');
		const item = itemStore.get(itemName);

		if (!item) {
			client.emit(Events.UnknownItem, { interaction, context: { itemName, amount } });
			return;
		}

		if (item.collectible) {
			client.emit(Events.ItemDenied, 'This item is a collectible and cannot be used', {
				item,
				interaction,
				context: { itemName, amount },
			});
			return;
		}

		if (typeof item.run !== 'function') {
			client.emit(Events.ItemDenied, 'This item cannot be used', { item, interaction, context: { itemName, amount } });
			return;
		}

		client.emit(Events.ItemAccepted, { item, interaction, context: { itemName, amount } });
	}
}
