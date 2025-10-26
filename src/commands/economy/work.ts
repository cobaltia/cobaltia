import { Command, Result } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { roundNumber } from '@sapphire/utilities';
import { EmbedBuilder, TimestampStyles, inlineCode, time } from 'discord.js';
import { getClient, getUser } from '#lib/database';
import { formatMoney } from '#util/common';

export class WorkCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Work to earn money.',
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => builder.setName(this.name).setDescription(this.description));
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) throw result.unwrapErr();
		const data = result.unwrap();

		const clientResult = await Result.fromAsync(async () => getClient(this.container.client.id!));
		if (clientResult.isErr()) throw clientResult.unwrapErr();
		const client = clientResult.unwrap();

		const cooldown = data.workCooldown.getTime();
		const now = Date.now();
		if (cooldown > now) {
			const date = roundNumber(cooldown / Time.Second);
			return interaction.followUp(`You can work again ${time(date, TimestampStyles.RelativeTime)}.`);
		}

		const money = roundNumber(200 + Math.random() * 150, 2);
		const tax = roundNumber(money * client.tax.div(100).toNumber(), 2);

		const toAdd = Time.Hour * 12;
		const newCooldown = new Date(now + toAdd);
		await this.container.prisma.user.update({
			where: { id: interaction.user.id },
			data: { wallet: { increment: money - tax }, workCooldown: newCooldown },
		});

		await this.container.prisma.client.update({
			where: { id: this.container.client.id! },
			data: { bankBalance: { increment: tax } },
		});

		this.container.metrics.incrementMoneyEarned({
			command: interaction.commandName,
			user: interaction.user.id,
			guild: interaction.guildId ?? 'none',
			channel: interaction.channelId,
			reason: 'work',
			value: money - tax,
		});

		this.container.metrics.incrementMoneyEarned({
			command: interaction.commandName,
			user: 'none',
			guild: interaction.guildId ?? 'none',
			channel: interaction.channelId,
			reason: 'tax',
			value: tax,
		});

		const embed = new EmbedBuilder().setDescription(
			`You worked and earned ${inlineCode(formatMoney(money - tax)!)} after tax 🤑🤑🤑`,
		);
		await interaction.editReply({ embeds: [embed] });
	}
}
