import { Command, Result } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { roundNumber } from '@sapphire/utilities';
import { EmbedBuilder, inlineCode } from 'discord.js';
import { getClient } from '#lib/database';
import { formatMoney } from '#util/common';

export class WorkCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Work to earn money.',
			cooldownDelay: Time.Hour * 12,
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => builder.setName(this.name).setDescription(this.description));
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();

		const clientResult = await Result.fromAsync(async () => getClient(this.container.client.id!));
		if (clientResult.isErr()) throw clientResult.unwrapErr();
		const client = clientResult.unwrap();

		const money = roundNumber(200 + Math.random() * 150, 2);
		const tax = roundNumber(money * client.tax.div(100).toNumber(), 2);

		await this.container.prisma.user.upsert({
			create: { id: interaction.user.id, wallet: money - tax },
			update: { wallet: { increment: money - tax } },
			where: { id: interaction.user.id },
		});

		await this.container.prisma.client.update({
			where: { id: this.container.client.id! },
			data: { bankBalance: { increment: tax } },
		});

		this.container.analytics.recordMoney({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: interaction.commandName,
			reason: 'WORK',
			amount: money - tax,
			type: 'EARNED',
		});

		this.container.analytics.recordMoney({
			userId: this.container.client.id!,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: interaction.commandName,
			reason: 'TAX',
			amount: tax,
			type: 'LOST',
		});

		const embed = new EmbedBuilder().setDescription(
			`You worked and earned ${inlineCode(formatMoney(money - tax)!)} after tax 🤑🤑🤑`,
		);
		await interaction.editReply({ embeds: [embed] });
	}
}
