import { Command, Result } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { roundNumber } from '@sapphire/utilities';
import { EmbedBuilder, TimestampStyles, inlineCode, time } from 'discord.js';
import { getClient } from '#lib/database';
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
		const result = await Result.fromAsync(async () =>
			this.container.prisma.user.findUniqueOrThrow({ where: { id: interaction.user.id } }),
		);
		const data = result.unwrap();

		if (result.isErr()) throw result.unwrapErr();
		const clientResult = await Result.fromAsync(async () => getClient(this.container.client.id!));
		if (clientResult.isErr()) throw clientResult.unwrapErr();
		const client = clientResult.unwrap();

		const cooldown = data.workCooldown.getTime();
		const now = Date.now();
		if (cooldown > now) {
			const date = roundNumber(cooldown / Time.Second);
			return interaction.followUp(`You can work again ${time(date, TimestampStyles.RelativeTime)}.`);
		}

		const money = roundNumber(200 + Math.random() * 150);
		const tax = roundNumber(money * (client.tax / 100));

		const newCooldown = new Date(now + Time.Day);
		await this.container.prisma.user.update({
			where: { id: interaction.user.id },
			data: { wallet: { increment: money - tax }, workCooldown: newCooldown },
		});

		await this.container.prisma.client.update({
			where: { id: this.container.client.id! },
			data: { bankBalance: { increment: tax } },
		});

		const embed = new EmbedBuilder().setDescription(
			`You worked and earned ${inlineCode(formatMoney(money - tax)!)} after tax 🤑🤑🤑`,
		);
		await interaction.editReply({ embeds: [embed] });
	}
}
