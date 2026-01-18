import { Command } from '@sapphire/framework';
import {
	ActionRowBuilder,
	EmbedBuilder,
	type MessageActionRowComponentBuilder,
	inlineCode,
	StringSelectMenuBuilder,
} from 'discord.js';
import { getGlobalLevel, getLocalLevel } from '#lib/database';
import { ONE_TO_TEN } from '#lib/util/constants';
import { fetchMembersFromCache } from '#lib/util/functions/cache';

export class LeaderboardCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'View the leaderboard of the server.',
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option =>
					option
						.setName('scope')
						.setDescription('View the local or global leaderboard.')
						.setChoices(['local', 'global'].map(value => ({ name: value, value }))),
				),
		);
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const scope = interaction.options.getString('scope') ?? 'local';

		if (scope === 'local') {
			await this.localLeaderboard(interaction);
		} else {
			await this.globalLeaderboard(interaction);
		}
	}

	private async localLeaderboard(interaction: Command.ChatInputCommandInteraction) {
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
			.setDescription(description.join('\n'))
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

	private async globalLeaderboard(interaction: Command.ChatInputCommandInteraction) {
		const result = await getGlobalLevel();
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
			.setURL('https://www.cobaltia.gg/leaderboard')
			.setFooter({ text: 'For a more comprehensive list visit the website' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-global`).addOptions([
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
}
