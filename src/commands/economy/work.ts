import { Command, Result } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { roundNumber } from '@sapphire/utilities';
import { EmbedBuilder, TimestampStyles, inlineCode, time } from 'discord.js';
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
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const cooldown = data.workCooldown.getTime();
		const now = Date.now();
		if (cooldown > now) {
			return interaction.followUp(`You can work again in ${time(cooldown, TimestampStyles.RelativeTime)}.`);
		}

		const money = roundNumber(200 + Math.random() * 150);

		const newCooldown = new Date(now + Time.Day);
		await this.container.prisma.user.update({
			where: { id: interaction.user.id },
			data: { wallet: data.wallet + money, workCooldown: newCooldown },
		});

		const embed = new EmbedBuilder().setDescription(
			`You worked and earned ${inlineCode(formatMoney(money)!)} 🤑🤑🤑`,
		);
		await interaction.editReply({ embeds: [embed] });
	}
}
