import { getLocalUserLevelLeaderboard } from '@prisma/client/sql';
import { Command, Result } from '@sapphire/framework';
import {
	ActionRowBuilder,
	EmbedBuilder,
	type MessageActionRowComponentBuilder,
	inlineCode,
	StringSelectMenuBuilder,
} from 'discord.js';
import { ONE_TO_TEN } from '#lib/util/constants';

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
		const users = await interaction.guild?.members.fetch();
		const result = await Result.fromAsync(async () =>
			this.container.prisma.$queryRawTyped(getLocalUserLevelLeaderboard(users!.map(user => user.id))),
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
			.setTitle('Local Level Leaderboard')
			.setDescription(description.join('\n'))
			.setFooter({ text: 'For a full list visit the website (coming soon)' });
		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId(`select-menu:leaderboard-local`).addOptions([
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

	private async globalLeaderboard(interaction: Command.ChatInputCommandInteraction) {
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
}
