import { Result } from '@sapphire/result';
import { bold, inlineCode, type ChatInputCommandInteraction } from 'discord.js';
import { Item } from '#lib/structures/Item';
import { type ItemPayload } from '#lib/types';
import { ItemEmojis } from '#lib/util/constants';
import { getInventory } from '#lib/util/functions/inventoryHelper';
import { pickWeightedRandom } from '#util/common';

export class ChristmasGiftItem2025 extends Item {
	public constructor(context: Item.LoaderContext, options: Item.Options) {
		super(context, {
			...options,
			displayName: 'Christmas Gift 2025',
			description: 'A festive gift to celebrate the holiday season!',
			price: -1,
			sellPrice: 100,
			icon: ItemEmojis.ChristmasGift2025,
		});
	}

	public async run(interaction: ChatInputCommandInteraction, payload: ItemPayload) {
		const { context } = payload;
		await interaction.deferReply();

		const result = await Result.fromAsync(async () => getInventory(interaction.user.id));
		if (result.isErr()) throw result.unwrapErr();
		const inventoryData = result.unwrap();

		if (inventoryData.isNone()) return interaction.followUp('You do not have any Christmas gifts to open.');

		const data = inventoryData.unwrap();

		if ((data.get('christmasGift2025') ?? 0) < context.amount) {
			return interaction.followUp('You do not have enough Christmas gifts to open.');
		}

		const giftOptions = ['candyCane', 'santaHat', 'snowGlobe', 'banknote', 'goldenNutcracker'];
		const giftWeights = [40, 20, 28, 10, 2];
		const itemStore = this.container.stores.get('items');
		const received: Record<string, number> = {};

		for (let ii = 0; ii < context.amount; ii++) {
			const index = pickWeightedRandom(giftWeights);
			const selectedGift = giftOptions[index];
			received[selectedGift] = (received[selectedGift] ?? 0) + 1;
		}

		for (const [itemId, count] of Object.entries(received)) {
			await this.container.prisma.inventory.upsert({
				where: { userId_itemId: { userId: interaction.user.id, itemId } },
				create: { userId: interaction.user.id, itemId, quantity: count },
				update: { quantity: { increment: count } },
			});
		}

		await this.container.prisma.inventory.update({
			where: { userId_itemId: { userId: interaction.user.id, itemId: 'christmasGift2025' } },
			data: { quantity: { decrement: context.amount } },
		});

		const summary = Object.entries(received)
			.map(([itemId, count]) => {
				const item = itemStore.get(itemId);
				const itemName = item ? item.displayName : itemId;
				return `You have opened ${inlineCode(count.toString())} x ${item?.icon} ${bold(itemName)}!`;
			})
			.join('\n');

		return interaction.followUp(summary);
	}
}
