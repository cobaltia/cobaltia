import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { bold, type ButtonInteraction } from 'discord.js';
import { pickWeightedRandom } from '#util/common';

export class ChristmasButtonHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Button,
		});
	}

	public override parse(interaction: ButtonInteraction) {
		const customId = interaction.customId;
		if (customId === 'button:christmas:claim') return this.some();

		return this.none();
	}

	public async run(interaction: ButtonInteraction) {
		const itemStore = this.container.stores.get('items');
		const christmasGift = itemStore.get('christmasGift2025');
		const random = pickWeightedRandom([50, 25, 15, 8, 2]) + 1;

		const content = `${interaction.user} has received ${random === 1 ? 'a' : random} ${christmasGift?.iconEmoji} ${bold(christmasGift!.displayName)}!`;

		await interaction.update({ components: [], content, embeds: [], allowedMentions: { users: [] } });

		await this.container.prisma.inventory.upsert({
			create: {
				userId: interaction.user.id,
				itemId: 'christmasGift2025',
				quantity: random,
			},
			update: {
				quantity: { increment: random },
			},
			where: {
				userId_itemId: {
					userId: interaction.user.id,
					itemId: 'christmasGift2025',
				},
			},
		});
	}
}
