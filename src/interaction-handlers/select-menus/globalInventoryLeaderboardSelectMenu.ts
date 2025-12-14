import { InteractionHandler, InteractionHandlerTypes, Result } from '@sapphire/framework';
import {
	ActionRowBuilder,
	EmbedBuilder,
	inlineCode,
	type MessageActionRowComponentBuilder,
	StringSelectMenuBuilder,
	type StringSelectMenuInteraction,
} from 'discord.js';
import { ONE_TO_TEN } from '#lib/util/constants';

export class GlobalInventoryLeaderboardSelectMenu extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.SelectMenu,
		});
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		const customId = interaction.customId;
		if (customId === 'select-menu:leaderboard-global-inventory') return this.some();
		return this.none();
	}

	public async run(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const value = interaction.values[0];
		const result = await Result.fromAsync(async () =>
			this.container.prisma.inventory.findMany({
				take: 10,
				orderBy: { quantity: 'desc' },
				where: { itemId: value },
			}),
		);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.userId);
			const itemCount = userData.quantity;
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${itemCount} `)} - ${user}`);
		}

		const itemStore = this.container.stores.get('items');

		const embed = new EmbedBuilder()
			.setTitle(`Global ${itemStore.get(value)?.displayName ?? 'Item'} Leaderboard`)
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setURL('https://www.cobaltia.gg/leaderboard')
			.setFooter({ text: 'For a more comprehensive list visit the website' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-global`).addOptions([
					{ label: 'Wallet', value: 'wallet' },
					{ label: 'Bank', value: 'bank' },
					{ label: 'Net Worth', value: 'networth' },
					{ label: 'Level', value: 'level' },
					{ label: 'Social Credit', value: 'socialcredit' },
					{ label: 'VC Time', value: 'vctime' },
					{ label: 'Inventory', value: 'inventory', default: true },
				]),
			),
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-global-inventory`).addOptions(
					itemStore.sort().map(item => ({
						emoji:
							typeof item.iconEmoji === 'object' ? { id: item.iconEmoji.id } : { name: item.iconEmoji },
						label: item.displayName,
						description: item.description.slice(0, 100),
						value: item.name,
						default: item.name === value,
					})),
				),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}
}
