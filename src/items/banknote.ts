import { type ChatInputCommandInteraction } from 'discord.js';
import { Item } from '#structures/Item';

export class BanknoteItem extends Item {
	public constructor(context: Item.LoaderContext, options: Item.Options) {
		super(context, {
			...options,
			description: 'A banknote that can be exchanged for money.',
			price: 1_000,
		});
	}

	public async run(interaction: ChatInputCommandInteraction) {
		return interaction.reply('You have exchanged the banknote for money.');
	}
}
