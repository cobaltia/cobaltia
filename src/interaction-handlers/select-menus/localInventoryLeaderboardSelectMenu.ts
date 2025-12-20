import { InteractionHandler, InteractionHandlerTypes, Result } from '@sapphire/framework';
import {
	type MessageActionRowComponentBuilder,
	ActionRowBuilder,
	EmbedBuilder,
	inlineCode,
	StringSelectMenuBuilder,
	type StringSelectMenuInteraction,
} from 'discord.js';
import { ONE_TO_TEN } from '#lib/util/constants';
import { fetchMembersFromCache } from '#lib/util/functions/cache';

export class LocalInventoryLeaderboardSelectMenu extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.SelectMenu,
		});
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		const customId = interaction.customId;
		if (customId === 'select-menu:leaderboard-local-inventory') return this.some();
		return this.none();
	}

	public async run(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const value = interaction.values[0];
		const users = await fetchMembersFromCache(interaction.guild!);
		const result = await Result.fromAsync(async () =>
			this.container.prisma.inventory.findMany({
				where: {
					itemId: value,
					userId: { in: users },
					quantity: { gt: 0 },
				},
				take: 10,
				orderBy: { quantity: 'desc' },
			}),
		);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, itemData] of data.entries()) {
			const user = await this.container.client.users.fetch(itemData.userId);
			const quantity = itemData.quantity.toString();
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${quantity} `)} - ${user}`);
		}

		const itemStore = this.container.stores.get('items');
		const itemsWithEntries = await this.container.prisma.inventory.groupBy({
			by: ['itemId'],
			where: { quantity: { gt: 0 }, userId: { in: users } },
		});
		const itemIdsWithEntries = new Set(itemsWithEntries.map(item => item.itemId));

		const embed = new EmbedBuilder()
			.setTitle(`Local ${itemStore.get(value)?.displayName ?? 'Item'} Leaderboard`)
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setURL('https://www.cobaltia.gg/leaderboard')
			.setFooter({ text: 'For a more comprehensive list visit the website' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-local`).addOptions([
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
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-local-inventory`).addOptions(
					itemStore
						.sort()
						.filter(item => itemIdsWithEntries.has(item.name))
						.map(item => ({
							emoji:
								typeof item.iconEmoji === 'object'
									? { id: item.iconEmoji.id }
									: { name: item.iconEmoji },
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
