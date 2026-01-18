import { InteractionHandler, InteractionHandlerTypes, Result } from '@sapphire/framework';
import { DurationFormatter } from '@sapphire/time-utilities';
import {
	ActionRowBuilder,
	EmbedBuilder,
	inlineCode,
	type MessageActionRowComponentBuilder,
	StringSelectMenuBuilder,
	type StringSelectMenuInteraction,
} from 'discord.js';
import {
	getLocalBank,
	getLocalLevel,
	getLocalNetworth,
	getLocalSocialCredit,
	getLocalVcTime,
	getLocalWallet,
} from '#lib/database';
import { formatMoney } from '#util/common';
import { ONE_TO_TEN } from '#util/constants';
import { fetchMembersFromCache } from '#util/functions/cache';

export class GlobalLeaderboardSelectMenuHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.SelectMenu,
		});
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		const customId = interaction.customId;
		if (customId === 'select-menu:leaderboard-local') return this.some();
		return this.none();
	}

	public async run(interaction: StringSelectMenuInteraction) {
		const value = interaction.values[0];
		if (value === 'wallet') return this.handleWallet(interaction);
		if (value === 'bank') return this.handleBank(interaction);
		if (value === 'level') return this.handleLevel(interaction);
		if (value === 'networth') return this.handleNetWorth(interaction);
		if (value === 'socialcredit') return this.handleSocialCredit(interaction);
		if (value === 'vctime') return this.handleVcTime(interaction);
		if (value === 'inventory') return this.handleInventory(interaction);
	}

	private async handleWallet(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const users = await fetchMembersFromCache(interaction.guild!);
		const result = await getLocalWallet(users);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.id);
			const wallet = userData.wallet.toString();
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${formatMoney(wallet)} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Local Wallet Leaderboard')
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setURL('https://www.cobaltia.gg/leaderboard')
			.setFooter({ text: 'For a more comprehensive list visit the website' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-local`).addOptions([
					{ label: 'Wallet', value: 'wallet', default: true },
					{ label: 'Bank', value: 'bank' },
					{ label: 'Net Worth', value: 'networth' },
					{ label: 'Level', value: 'level' },
					{ label: 'Social Credit', value: 'socialcredit' },
					{ label: 'VC Time', value: 'vctime' },
					{ label: 'Inventory', value: 'inventory' },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleBank(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const users = await fetchMembersFromCache(interaction.guild!);
		const result = await getLocalBank(users);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.id);
			const bank = userData.bankBalance.toString();
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${formatMoney(bank)} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Local Bank Leaderboard')
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setURL('https://www.cobaltia.gg/leaderboard')
			.setFooter({ text: 'For a more comprehensive list visit the website' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-local`).addOptions([
					{ label: 'Wallet', value: 'wallet' },
					{ label: 'Bank', value: 'bank', default: true },
					{ label: 'Net Worth', value: 'networth' },
					{ label: 'Level', value: 'level' },
					{ label: 'Social Credit', value: 'socialcredit' },
					{ label: 'VC Time', value: 'vctime' },
					{ label: 'Inventory', value: 'inventory' },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleLevel(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const users = await fetchMembersFromCache(interaction.guild!);
		const result = await getLocalLevel(users);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.id);
			const level = userData.level.toString();
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${level} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Local Level Leaderboard')
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setURL('https://www.cobaltia.gg/leaderboard')
			.setFooter({ text: 'For a more comprehensive list visit the website' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-local`).addOptions([
					{ label: 'Wallet', value: 'wallet' },
					{ label: 'Bank', value: 'bank' },
					{ label: 'Net Worth', value: 'networth' },
					{ label: 'Level', value: 'level', default: true },
					{ label: 'Social Credit', value: 'socialcredit' },
					{ label: 'VC Time', value: 'vctime' },
					{ label: 'Inventory', value: 'inventory' },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleNetWorth(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const users = await fetchMembersFromCache(interaction.guild!);
		const result = await getLocalNetworth(users);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.id);
			const netWorth = (userData.net_worth ?? 0).toString();
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${formatMoney(netWorth)} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Local Net Worth Leaderboard')
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setURL('https://www.cobaltia.gg/leaderboard')
			.setFooter({ text: 'For a more comprehensive list visit the website' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-local`).addOptions([
					{ label: 'Wallet', value: 'wallet' },
					{ label: 'Bank', value: 'bank' },
					{ label: 'Net Worth', value: 'networth', default: true },
					{ label: 'Level', value: 'level' },
					{ label: 'Social Credit', value: 'socialcredit' },
					{ label: 'VC Time', value: 'vctime' },
					{ label: 'Inventory', value: 'inventory' },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleSocialCredit(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const users = await fetchMembersFromCache(interaction.guild!);
		const result = await getLocalSocialCredit(users);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.id);
			const socialCredit = userData.socialCredit.toString();
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${socialCredit} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Local Social Credit Leaderboard')
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
					{ label: 'Social Credit', value: 'socialcredit', default: true },
					{ label: 'VC Time', value: 'vctime' },
					{ label: 'Inventory', value: 'inventory' },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleVcTime(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const result = await getLocalVcTime(interaction.guildId!);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.user_id);
			const vcTime = new DurationFormatter().format(Number(userData.total_duration));
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${vcTime} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Local VC Time Leaderboard')
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
					{ label: 'VC Time', value: 'vctime', default: true },
					{ label: 'Inventory', value: 'inventory' },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	public async handleInventory(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const value = 'banknote';
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
