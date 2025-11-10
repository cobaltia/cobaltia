import { type User as PrismaUser } from '@prisma/client';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { Result } from '@sapphire/result';
import { Time } from '@sapphire/time-utilities';
import { roundNumber } from '@sapphire/utilities';
import { bold } from 'discord.js';
import { getUser } from '#lib/database';
import { pickWeightedRandom } from '#util/common';

export class EventCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'Event games.',
			subcommands: [{ name: 'christmas', chatInputRun: 'chatInputChristmas' }],
			cooldownDelay: Time.Second,
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand(subcommand => subcommand.setName('christmas').setDescription('Play the Christmas event game.')),
		);
	}

	public async chatInputChristmas(interaction: Subcommand.ChatInputCommandInteraction) {
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
		await this.container.prisma.inventory.upsert({
			where: { userId_itemId: { userId: data.id, itemId: 'christmasGift2025' } },
			create: { userId: data.id, itemId: 'christmasGift2025', quantity: 1 },
			update: { quantity: { increment: 1 } },
		});

		return 'You found a Christmas present under the tree! 🎁';
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

		return `You got a ${item.icon} ${bold(item.displayName)} in your stocking...`;
	}
}
