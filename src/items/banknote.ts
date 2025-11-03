import { Result } from '@sapphire/result';
import { type ChatInputCommandInteraction } from 'discord.js';
import { type ItemPayload } from '#lib/types';
import { getInventory } from '#lib/util/functions/inventoryHelper';
import { Item } from '#structures/Item';
import { formatMoney } from '#util/common';

export class BanknoteItem extends Item {
	public constructor(context: Item.LoaderContext, options: Item.Options) {
		super(context, {
			...options,
			displayName: 'Banknote',
			description: 'A banknote that can be exchanged for bank space.',
			price: 999.99,
			icon: '💰',
		});
	}

	public async run(interaction: ChatInputCommandInteraction, payload: ItemPayload) {
		const { context } = payload;
		await interaction.deferReply();
		const result = await Result.fromAsync(() => getInventory(interaction.user.id));
		if (result.isErr()) throw new Error('Failed to get inventory data');

		const resultData = result.unwrap();

		if (resultData.isNone()) return interaction.followUp('You do not have enough banknotes to exchange.');

		const data = resultData.unwrap();

		if ((data.get('banknote') ?? 0) < context.amount) {
			return interaction.followUp('You do not have enough banknotes to exchange.');
		}

		const bankSpace = context.amount * 10_000;

		await this.container.prisma.user.update({
			where: { id: interaction.user.id },
			data: { bankLimit: { increment: bankSpace } },
		});

		await this.container.prisma.inventory.update({
			where: { userId_itemId: { userId: interaction.user.id, itemId: 'banknote' } },
			data: { quantity: { decrement: context.amount } },
		});

		return interaction.followUp(
			`You have exchanged ${context.amount} banknotes for ${formatMoney(bankSpace)} bank space.`,
		);
	}
}
