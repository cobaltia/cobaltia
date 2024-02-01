import { type User as PrismaUser } from '@prisma/client';
import { Command, Result } from '@sapphire/framework';
import { DurationFormatter } from '@sapphire/time-utilities';
import { EmbedBuilder, TimestampStyles, type User, inlineCode, time, ApplicationCommandType } from 'discord.js';
import { getUser } from '#lib/database';
import { compactNumber, formatMoney, formatNumber } from '#lib/util/common';
import { getTag } from '#lib/util/discord-utilities';
import { nextLevel } from '#lib/util/experience';

export class ProfileCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Get your profile.',
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption(options =>
					options.setName('user').setDescription('The user to get the profile of.').setRequired(false),
				),
		);

		registry.registerContextMenuCommand(builder => builder.setName(this.name).setType(ApplicationCommandType.User));
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const user = interaction.options.getUser('user') ?? interaction.user;
		const result = await Result.fromAsync(async () => getUser(user.id));

		await result.match({
			ok: async data => this.handleOk(interaction, data, user),
			err: async error => this.handleError(interaction, error),
		});
	}

	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		await interaction.deferReply();
		const user = await this.container.client.users.fetch(interaction.targetId);

		const result = await Result.fromAsync(async () => getUser(user.id));

		await result.match({
			ok: async data => this.handleOk(interaction, data, user),
			err: async error => this.handleError(interaction, error),
		});
	}

	private async handleOk(
		interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
		data: PrismaUser,
		user: User,
	) {
		const embed = new EmbedBuilder()
			.setTitle(`${getTag(user)}'s Profile`)
			.setFields(
				{ name: 'Level', value: this.getLevel(data), inline: true },
				{ name: 'Money', value: this.getMoney(data), inline: true },
				{ name: 'Other', value: this.getOther(data), inline: true },
				{ name: 'Voice Chat', value: await this.getVoice(data), inline: true },
			);
		return interaction.editReply({
			embeds: [embed],
		});
	}

	private async handleError(
		interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
		error: unknown,
	) {
		this.container.logger.error(error);
		return interaction.editReply('Failed to retrieve profile');
	}

	private getLevel(data: PrismaUser) {
		const next = nextLevel(data.level);
		const content = [
			`Level: ${inlineCode(formatNumber(data.level)!)}`,
			`Experience: ${inlineCode(`${compactNumber(data.experience)!}/${compactNumber(next.unwrap()!)}`)}`,
		];
		return content.join('\n');
	}

	private getMoney(data: PrismaUser) {
		const content = [
			`Wallet: ${inlineCode(formatMoney(data.wallet, true)!)}`,
			`Bank: ${inlineCode(formatMoney(data.bankBalance, true)!)}`,
			`Net: ${inlineCode(formatMoney(data.wallet + data.bankBalance, true)!)}`,
			`Bounty: ${inlineCode(formatMoney(data.bounty, true)!)}`,
		];
		return content.join('\n');
	}

	private getOther(data: PrismaUser) {
		const content = [`Social Credit: ${inlineCode(`${data.socialCredit.toString()}/2000`)}`];
		return content.join('\n');
	}

	private async getVoice(data: PrismaUser) {
		const formatter = new DurationFormatter();
		const voiceData = await this.container.prisma.voice.findMany({
			where: { userId: data.id },
			orderBy: { date: 'desc' },
		});
		if (voiceData.length === 0) return 'No voice data found';
		const content = [
			`Last Joined: ${time(voiceData[0].date, TimestampStyles.RelativeTime)}`,
			`Last Duration: ${inlineCode(formatter.format(voiceData[0].duration))}`,
			`Total Time: ${inlineCode(formatter.format(voiceData.reduce((acc, curr) => acc + curr.duration, 0)))}`,
		];
		return content.join('\n');
	}
}
