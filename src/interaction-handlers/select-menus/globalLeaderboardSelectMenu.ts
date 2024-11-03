import { getGlobalUserNetworthLeaderboard, getGlobalUSerVcTimeLeaderboard } from '@prisma/client/sql';
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
import { formatMoney } from '#util/common';
import { ONE_TO_TEN } from '#util/constants';

export class GlobalLeaderboardSelectMenuHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.SelectMenu,
		});
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		const customId = interaction.customId;
		if (customId === 'select-menu:leaderboard-global') return this.some();
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
	}

	private async handleWallet(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const result = await Result.fromAsync(async () =>
			this.container.prisma.user.findMany({ take: 10, orderBy: { wallet: 'desc' } }),
		);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.id);
			const wallet = userData.wallet.toString();
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${formatMoney(wallet)} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Global Wallet Leaderboard')
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setFooter({ text: 'For a full list visit the website (coming soon)' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-global`).addOptions([
					{ label: 'Wallet', value: 'wallet', default: true },
					{ label: 'Bank', value: 'bank' },
					{ label: 'Net Worth', value: 'networth' },
					{ label: 'Level', value: 'level' },
					{ label: 'Social Credit', value: 'socialcredit' },
					{ label: 'VC Time', value: 'vctime' },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleBank(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const result = await Result.fromAsync(async () =>
			this.container.prisma.user.findMany({ take: 10, orderBy: { bankBalance: 'desc' } }),
		);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.id);
			const bank = userData.bankBalance.toString();
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${formatMoney(bank)} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Global Bank Leaderboard')
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setFooter({ text: 'For a full list visit the website (coming soon)' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-global`).addOptions([
					{ label: 'Wallet', value: 'wallet' },
					{ label: 'Bank', value: 'bank', default: true },
					{ label: 'Net Worth', value: 'networth' },
					{ label: 'Level', value: 'level' },
					{ label: 'Social Credit', value: 'socialcredit' },
					{ label: 'VC Time', value: 'vctime' },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleLevel(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const result = await Result.fromAsync(async () =>
			this.container.prisma.user.findMany({ take: 10, orderBy: { level: 'desc' } }),
		);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.id);
			const level = userData.level.toString();
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${level} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Global Level Leaderboard')
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setFooter({ text: 'For a full list visit the website (coming soon)' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-global`).addOptions([
					{ label: 'Wallet', value: 'wallet' },
					{ label: 'Bank', value: 'bank' },
					{ label: 'Net Worth', value: 'networth' },
					{ label: 'Level', value: 'level', default: true },
					{ label: 'Social Credit', value: 'socialcredit' },
					{ label: 'VC Time', value: 'vctime' },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleNetWorth(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const result = await Result.fromAsync(async () =>
			this.container.prisma.$queryRawTyped(getGlobalUserNetworthLeaderboard()),
		);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.id);
			const netWorth = (userData.net_worth ?? 0).toString();
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${formatMoney(netWorth)} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Global Net Worth Leaderboard')
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setFooter({ text: 'For a full list visit the website (coming soon)' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-global`).addOptions([
					{ label: 'Wallet', value: 'wallet' },
					{ label: 'Bank', value: 'bank' },
					{ label: 'Net Worth', value: 'networth', default: true },
					{ label: 'Level', value: 'level' },
					{ label: 'Social Credit', value: 'socialcredit' },
					{ label: 'VC Time', value: 'vctime' },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleSocialCredit(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const result = await Result.fromAsync(async () =>
			this.container.prisma.user.findMany({ take: 10, orderBy: { socialCredit: 'desc' } }),
		);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.id);
			const socialCredit = userData.socialCredit.toString();
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${socialCredit} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Global Social Credit Leaderboard')
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setFooter({ text: 'For a full list visit the website (coming soon)' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-global`).addOptions([
					{ label: 'Wallet', value: 'wallet' },
					{ label: 'Bank', value: 'bank' },
					{ label: 'Net Worth', value: 'networth' },
					{ label: 'Level', value: 'level' },
					{ label: 'Social Credit', value: 'socialcredit', default: true },
					{ label: 'VC Time', value: 'vctime' },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleVcTime(interaction: StringSelectMenuInteraction) {
		await interaction.deferUpdate();
		const result = await Result.fromAsync(async () =>
			this.container.prisma.$queryRawTyped(getGlobalUSerVcTimeLeaderboard()),
		);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const description = [];

		for (const [index, userData] of data.entries()) {
			const user = await this.container.client.users.fetch(userData.user_id);
			const vcTime = new DurationFormatter().format(Number(userData.total_duration));
			description.push(`${ONE_TO_TEN.get(index + 1)} ${inlineCode(` ${vcTime} `)} - ${user}`);
		}

		const embed = new EmbedBuilder()
			.setTitle('Global VC Time Leaderboard')
			.setDescription(description.length ? description.join('\n') : 'No users found.')
			.setFooter({ text: 'For a full list visit the website (coming soon)' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-global`).addOptions([
					{ label: 'Wallet', value: 'wallet' },
					{ label: 'Bank', value: 'bank' },
					{ label: 'Net Worth', value: 'networth' },
					{ label: 'Level', value: 'level' },
					{ label: 'Social Credit', value: 'socialcredit' },
					{ label: 'VC Time', value: 'vctime', default: true },
				]),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}
}
