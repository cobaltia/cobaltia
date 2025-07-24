import { Result, UserError } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { roundNumber } from '@sapphire/utilities';
import { EmbedBuilder, inlineCode } from 'discord.js';
import { roll } from 'dnd5e-dice-roller';
import { getClient, getUser } from '#lib/database';
import { formatMoney, getNumberWithSuffix, parseNumberWithSuffix } from '#util/common';
import { Colors } from '#util/constants';
import { options } from '#util/economy';

export class PlayCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'Play a game.',
			subcommands: [{ name: 'gamble', chatInputRun: 'chatInputGamble' }],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand(subcommand =>
					subcommand
						.setName('gamble')
						.setDescription('Gamble your money.')
						.addStringOption(option =>
							option.setName('amount').setDescription('The amount of money to gamble.').setRequired(true),
						),
				),
		);
	}

	public async chatInputGamble(interaction: Subcommand.ChatInputCommandInteraction) {
		const amount = interaction.options.getString('amount', true);
		const raw = getNumberWithSuffix(amount);
		if ((!options.has(amount.toLowerCase()) && raw === null) || (raw && raw.suffix !== '%' && raw.number < 50)) {
			throw new UserError({
				identifier: 'InvalidAmount',
				message: 'I need a valid amount greater than or equal to 50 to gamble.',
			});
		}

		await interaction.deferReply();
		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) throw result.unwrapErr();
		const data = result.unwrap();

		const clientResult = await Result.fromAsync(async () => getClient(this.container.client.id!));
		if (clientResult.isErr()) throw clientResult.unwrapErr();
		const client = clientResult.unwrap();

		let amountToGamble = raw ? parseNumberWithSuffix(raw.number, raw.suffix) : 0;
		const canGamble = data.wallet;
		if (canGamble === 0) {
			throw new UserError({ identifier: 'NotEnoughMoney', message: 'You do not have enough money to gamble.' });
		}

		if (!raw && amount.toLowerCase() === 'all') amountToGamble = data.wallet;
		if (!raw && amount.toLowerCase() === 'half') amountToGamble = roundNumber(data.wallet / 2, 2);
		if (!raw && amount.toLowerCase() === 'max') amountToGamble = data.wallet;
		if (raw?.suffix === '%') amountToGamble = roundNumber(data.wallet * (amountToGamble / 100), 2);
		if (amountToGamble > data.wallet) {
			throw new UserError({ identifier: 'NotEnoughMoney', message: 'You do not have enough money to gamble.' });
		}

		if (amountToGamble < 50) {
			throw new UserError({
				identifier: 'InvalidAmount',
				message: 'I need a valid amount greater than 50 to gamble.',
			});
		}

		const houseRoll = roll('3d4');
		const userRoll = roll('1d12');

		const embed = new EmbedBuilder().setFields(
			{ name: interaction.user.username, value: `Rolled a ${inlineCode(userRoll.toString())}`, inline: true },
			{ name: 'House', value: `Rolled a ${inlineCode(houseRoll.toString())}`, inline: true },
		);

		if (houseRoll < userRoll) {
			const won = roundNumber(amountToGamble * 1.5, 2);
			const tax = roundNumber(won * (client.tax / 100), 2);
			await this.container.prisma.client.update({
				where: { id: this.container.client.id! },
				data: { bankBalance: { increment: tax } },
			});
			const next = await this.container.prisma.user.update({
				where: { id: interaction.user.id },
				data: { wallet: { increment: won - tax } },
			});

			this.container.metrics.updateMoney({
				command: interaction.commandName,
				user: interaction.user.id,
				guild: interaction.guildId ?? 'none',
				channel: interaction.channelId,
				reason: 'gambling',
				type: 'earn',
				value: won - tax,
			});
			this.container.metrics.updateMoney({
				command: interaction.commandName,
				user: 'none',
				guild: interaction.guildId ?? 'none',
				channel: interaction.channelId,
				reason: 'tax',
				type: 'earn',
				value: tax,
			});

			embed
				.setDescription(
					`You won ${formatMoney(won - tax)} after paying ${formatMoney(
						tax,
					)} of tax!\n\nYour new balance is ${formatMoney(next.wallet)}.`,
				)
				.setColor(Colors.Green);
		} else if (houseRoll === userRoll) {
			embed.setDescription('It was a tie! You get your money back.');
		} else {
			const next = await this.container.prisma.user.update({
				where: { id: interaction.user.id },
				data: { wallet: { decrement: amountToGamble } },
			});
			await this.container.prisma.client.update({
				where: { id: this.container.client.id! },
				data: { bankBalance: { increment: amountToGamble } },
			});
			this.container.metrics.updateMoney({
				command: interaction.commandName,
				user: interaction.user.id,
				guild: interaction.guildId ?? 'none',
				channel: interaction.channelId,
				reason: 'gambling',
				type: 'lost',
				value: amountToGamble,
			});
			this.container.metrics.updateMoney({
				command: interaction.commandName,
				user: 'none',
				guild: interaction.guildId ?? 'none',
				channel: interaction.channelId,
				reason: 'gambling',
				type: 'earn',
				value: amountToGamble,
			});
			embed
				.setDescription(`You lost ${formatMoney(amountToGamble)}.\n\nYour new balance is ${formatMoney(next.wallet)}.`)
				.setColor(Colors.Red);
		}

		await interaction.editReply({ embeds: [embed] });
	}
}
