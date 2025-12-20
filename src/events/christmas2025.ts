import { type User as PrismaUser } from '@prisma/client';
import { Result } from '@sapphire/result';
import { roundNumber } from '@sapphire/utilities';
import { bold, type ChatInputCommandInteraction } from 'discord.js';
import { getUser } from '#lib/database';
import { Event } from '#lib/structures/Event';
import { pickWeightedRandom } from '#util/common';

export class Christmas2025 extends Event {
	public constructor(context: Event.LoaderContext, options: Event.Options) {
		super(context, {
			...options,
			name: 'christmas2025',
		});
	}

	public async run(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) throw result.unwrapErr();
		const data = result.unwrap();

		const goodPercentage = roundNumber(data.socialCredit / 2_000, 2) * 100;
		const weights = [goodPercentage, 100 - goodPercentage];
		console.log(weights);

		const situation = pickWeightedRandom(weights);
		switch (situation) {
			case 0:
				return interaction.editReply(await this.christmasGoodOutcome(data));
			case 1:
				return interaction.editReply(await this.christmasBadOutcome(data));
		}
	}

	private async christmasGoodOutcome(data: PrismaUser) {
		const itemStore = this.container.stores.get('items');
		const item = itemStore.get('christmasGift2025');
		if (!item) return 'Something went wrong while getting your gift...';

		await this.container.prisma.inventory.upsert({
			where: { userId_itemId: { userId: data.id, itemId: 'christmasGift2025' } },
			create: { userId: data.id, itemId: 'christmasGift2025', quantity: 1 },
			update: { quantity: { increment: 1 } },
		});

		return `You found a ${item.iconEmoji} ${bold(item.displayName)} present under the tree!`;
	}

	private async christmasBadOutcome(data: PrismaUser) {
		const itemStore = this.container.stores.get('items');
		const giftOptions = ['coal', 'brokenCandyCane'];
		const selectedGift = giftOptions[Math.floor(Math.random() * giftOptions.length)];
		const item = itemStore.get(selectedGift);
		if (!item) return 'Something went wrong while getting your gift...';

		await this.container.prisma.inventory.upsert({
			where: { userId_itemId: { userId: data.id, itemId: selectedGift } },
			create: { userId: data.id, itemId: selectedGift, quantity: 1 },
			update: { quantity: { increment: 1 } },
		});

		return `You got a ${item.iconEmoji} ${bold(item.displayName)} under the tree...`;
	}
}
