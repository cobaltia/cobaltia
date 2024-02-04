import { UserError } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { Result } from '@sapphire/result';
import { roundNumber } from '@sapphire/utilities';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	type MessageActionRowComponentBuilder,
} from 'discord.js';
import { getUser } from '#lib/database';
import { formatMoney, getNumberWithSuffix, parseNumberWithSuffix } from '#util/common';
import { handleDeposit, handleWithdraw, options } from '#util/economy';

export class BankCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'Manage your bank account.',
			subcommands: [
				{ name: 'balance', chatInputRun: 'chatInputBalance' },
				{ name: 'deposit', chatInputRun: 'chatInputDeposit' },
				{ name: 'withdraw', chatInputRun: 'chatInputWithdraw' },
				{ name: 'transfer', chatInputRun: 'chatInputTransfer' },
			],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand(command => command.setName('balance').setDescription('Check your bank balance.'))
				.addSubcommand(command =>
					command
						.setName('deposit')
						.setDescription('Deposit money into your bank account.')
						.addStringOption(option =>
							option
								.setName('amount')
								.setDescription(
									'A constant number like "1234", a shorthand like "2k" or a relative number like "20%" or "max".',
								)
								.setRequired(true),
						),
				)
				.addSubcommand(command =>
					command
						.setName('withdraw')
						.setDescription('Withdraw money from your bank account.')
						.addStringOption(option =>
							option
								.setName('amount')
								.setDescription(
									'A constant number like "1234", a shorthand like "2k" or a relative number like "20%" or "max".',
								)
								.setRequired(true),
						),
				)
				.addSubcommand(command =>
					command
						.setName('transfer')
						.setDescription('Transfer money to another user.')
						.addUserOption(option =>
							option.setName('user').setDescription('The user to transfer to.').setRequired(true),
						)
						.addStringOption(option =>
							option
								.setName('amount')
								.setDescription(
									'A constant number like "1234", a shorthand like "2k" or a relative number like "20%" or "max".',
								)
								.setRequired(true),
						),
				),
		);
	}

	public async chatInputBalance(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply();

		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) {
			return this.handleError(interaction, result.unwrapErr());
		}

		const data = result.unwrap();

		const embed = new EmbedBuilder()
			.setTitle(`${interaction.user.tag}'s Bank Balance`)
			.setFields(
				{ name: 'Wallet', value: formatMoney(data.wallet)!, inline: true },
				{ name: 'Bank', value: formatMoney(data.bankBalance)!, inline: true },
				{ name: 'Bank Space', value: formatMoney(data.bankLimit)!, inline: true },
				{ name: 'Total Net', value: formatMoney(data.wallet + data.bankBalance)!, inline: true },
			);

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Deposit')
					.setCustomId(`button:bank:deposit:${interaction.user.id}`)
					.setDisabled(data.wallet === 0),
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Withdraw')
					.setCustomId(`button:bank:withdraw:${interaction.user.id}`)
					.setDisabled(data.bankBalance === 0),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	public async chatInputDeposit(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply();

		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) {
			return this.handleError(interaction, result.unwrapErr());
		}

		const amount = interaction.options.getString('amount', true);
		const data = result.unwrap();
		const nextResult = await handleDeposit(data, amount);
		if (nextResult.isErr()) {
			return this.handleError(interaction, nextResult.unwrapErr());
		}

		const updated = nextResult.unwrap();
		const { next, money } = updated;

		const embed = new EmbedBuilder()
			.setTitle('Deposit Successful')
			.setDescription(formatMoney(money))
			.setFields(
				{ name: 'Current Wallet Balance', value: formatMoney(next.wallet)!, inline: true },
				{ name: 'Current Bank Balance', value: formatMoney(next.bankBalance)!, inline: true },
			);
		await interaction.editReply({ embeds: [embed] });
	}

	public async chatInputWithdraw(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply();

		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) {
			return this.handleError(interaction, result.unwrapErr());
		}

		const amount = interaction.options.getString('amount', true);
		const data = result.unwrap();
		const nextResult = await handleWithdraw(data, amount);
		if (nextResult.isErr()) {
			return this.handleError(interaction, nextResult.unwrapErr());
		}

		const updated = nextResult.unwrap();
		const { next, money } = updated;

		const embed = new EmbedBuilder()
			.setTitle('Withdraw Successful')
			.setDescription(formatMoney(money))
			.setFields(
				{ name: 'Current Wallet Balance', value: formatMoney(next.wallet)!, inline: true },
				{ name: 'Current Bank Balance', value: formatMoney(next.bankBalance)!, inline: true },
			);

		await interaction.editReply({ embeds: [embed] });
	}

	public async chatInputTransfer(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply();

		const transferorResult = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (transferorResult.isErr()) {
			return this.handleError(interaction, transferorResult.unwrapErr());
		}

		const user = interaction.options.getUser('user', true);
		const transfereeResult = await Result.fromAsync(async () => getUser(user.id));
		if (transfereeResult.isErr()) {
			return this.handleError(interaction, transfereeResult.unwrapErr());
		}

		const amount = interaction.options.getString('amount', true);
		const transferor = transferorResult.unwrap();
		const transferee = transfereeResult.unwrap();

		const raw = getNumberWithSuffix(amount);
		if ((!options.has(amount.toLowerCase()) && raw === null) || (raw && raw.number <= 0)) {
			return this.handleError(
				interaction,
				new UserError({
					identifier: 'InvalidAmount',
					message: 'I need a valid amount greater than 0 to transfer.',
				}),
			);
		}

		let amountToTransfer = raw ? parseNumberWithSuffix(raw.number, raw.suffix) : 0;
		const canTransfer = transferor.bankBalance;
		if (canTransfer === 0) {
			return this.handleError(
				interaction,
				new UserError({ identifier: 'NoMoney', message: 'You have no money in your bank account.' }),
			);
		}

		if (!raw && amount.toLowerCase() === 'all') amountToTransfer = transferor.bankBalance;
		if (!raw && amount.toLowerCase() === 'half') amountToTransfer = roundNumber(transferor.bankBalance / 2);
		if (!raw && amount.toLowerCase() === 'max') amountToTransfer = transferor.bankBalance;
		if (raw?.suffix === '%') amountToTransfer = roundNumber(transferor.bankBalance * (amountToTransfer / 100));

		const money = Math.min(amountToTransfer, canTransfer);

		await this.container.prisma.user.update({
			where: { id: transferor.id },
			data: { bankBalance: transferor.bankBalance - money },
		});
		await this.container.prisma.user.update({
			where: { id: transferee.id },
			data: { wallet: transferee.wallet + money },
		});

		const embed = new EmbedBuilder().setTitle('Transfer Successful').setDescription(formatMoney(money));

		await interaction.editReply({ embeds: [embed] });
	}

	private async handleError(interaction: Subcommand.ChatInputCommandInteraction, error: unknown) {
		this.container.logger.error(error);
		if (error instanceof UserError) await interaction.followUp({ content: error.message, ephemeral: true });
		else await interaction.editReply("Something went wrong. It's so over.....");
	}
}
