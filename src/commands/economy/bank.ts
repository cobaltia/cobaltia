import { UserError } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { Result } from '@sapphire/result';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	MessageFlags,
	bold,
	type MessageActionRowComponentBuilder,
} from 'discord.js';
import { getUser } from '#lib/database';
import { formatMoney } from '#util/common';
import { handleDeposit, handleTransfer, handleWithdraw } from '#util/economy';

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
				{ name: 'statement', chatInputRun: 'chatInputStatement' },
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
						)
						.addStringOption(option =>
							option.setName('reason').setDescription('The reason for the deposit.'),
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
						)
						.addStringOption(option =>
							option.setName('reason').setDescription('The reason for the withdrawal.'),
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
						)
						.addStringOption(option =>
							option.setName('reason').setDescription('The reason for the transfer.'),
						),
				)
				.addSubcommand(command => command.setName('statement').setDescription('View your bank statement.')),
		);
	}

	public async chatInputBalance(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply();

		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) {
			throw result.unwrapErr();
		}

		const data = result.unwrap();

		const embed = new EmbedBuilder()
			.setTitle(`${interaction.user.tag}'s Bank Balance`)
			.setFields(
				{ name: 'Wallet', value: formatMoney(data.wallet)!, inline: true },
				{ name: 'Bank', value: formatMoney(data.bankBalance)!, inline: true },
				{ name: 'Bank Space', value: formatMoney(data.bankLimit)!, inline: true },
				{ name: 'Total Net', value: formatMoney(data.wallet.add(data.bankBalance))!, inline: true },
			);

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Deposit')
					.setCustomId(`button:bank:deposit:${interaction.user.id}`)
					.setDisabled(data.wallet.equals(0)),
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Withdraw')
					.setCustomId(`button:bank:withdraw:${interaction.user.id}`)
					.setDisabled(data.bankBalance.equals(0)),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	public async chatInputDeposit(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply();

		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) {
			throw result.unwrapErr();
		}

		const amount = interaction.options.getString('amount', true);
		const reason = interaction.options.getString('reason');
		const data = result.unwrap();
		const nextResult = await handleDeposit(data, amount);
		if (nextResult.isErr()) {
			throw nextResult.unwrapErr();
		}

		const { next, money } = nextResult.unwrap();
		const description = ['Bank Deposit'];
		if (reason) description.push(reason);
		this.container.analytics.recordMoney({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: 'bank deposit',
			reason: 'DEPOSIT',
			amount: money,
			type: 'NEUTRAL',
			description: description.join('. '),
		});

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
			throw result.unwrapErr();
		}

		const amount = interaction.options.getString('amount', true);
		const reason = interaction.options.getString('reason');
		const data = result.unwrap();
		const nextResult = await handleWithdraw(data, amount);
		if (nextResult.isErr()) {
			throw nextResult.unwrapErr();
		}

		const { next, money } = nextResult.unwrap();
		const description = ['Bank Withdrawal'];
		if (reason) description.push(reason);
		this.container.analytics.recordMoney({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: 'bank withdraw',
			reason: 'WITHDRAW',
			amount: money,
			type: 'NEUTRAL',
			description: description.join('. '),
		});

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
		const user = interaction.options.getUser('user', true);

		if (user.id === interaction.user.id) {
			throw new UserError({ identifier: 'SelfTransfer', message: 'You cannot transfer money to yourself.' });
		}

		const transferorResult = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (transferorResult.isErr()) {
			throw transferorResult.unwrapErr();
		}

		const transfereeResult = await Result.fromAsync(async () => getUser(user.id));
		if (transfereeResult.isErr()) {
			throw transfereeResult.unwrapErr();
		}

		const amount = interaction.options.getString('amount', true);
		const reason = interaction.options.getString('reason');
		const transferor = transferorResult.unwrap();
		const transferee = transfereeResult.unwrap();

		const result = await Result.fromAsync(async () => handleTransfer(transferor, transferee, amount));
		if (result.isErr()) {
			throw result.unwrapErr();
		}

		const { money, transferor: next } = result.unwrap();
		this.container.analytics.recordMoney({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: 'bank transfer',
			reason: 'TRANSFER',
			amount: money,
			type: 'LOST',
			description: [`Transfer to ${user.username}`, reason].filter(entry => entry !== null).join('. '),
		});
		this.container.analytics.recordMoney({
			userId: user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: 'bank transfer',
			reason: 'DEPOSIT',
			amount: money,
			type: 'EARNED',
			description: [`Transfer from ${interaction.user.username}`, reason]
				.filter(entry => entry !== null)
				.join('. '),
		});

		const embed = new EmbedBuilder()
			.setTitle('Transfer Successful')
			.setDescription(formatMoney(money))
			.setFields(
				{ name: 'Current Wallet Balance', value: formatMoney(next.wallet)!, inline: true },
				{ name: 'Current Bank Balance', value: formatMoney(next.bankBalance)!, inline: true },
			);

		await interaction.editReply({ embeds: [embed] });
	}

	public async chatInputStatement(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const data = await this.container.prisma.moneyHistory.findMany({
			where: {
				userId: interaction.user.id,
				reason: { in: ['DEPOSIT', 'WITHDRAW', 'TRANSFER'] },
			},
			orderBy: { createdAt: 'desc' },
			take: 10,
		});

		const transactions = data.map(entry => {
			const symbol = entry.type === 'EARNED' ? bold('+') : entry.type === 'LOST' ? bold('\\-') : bold('~');
			const desc = entry.description ?? entry.reason;
			return `${symbol} ${formatMoney(entry.amount)} - ${desc}`;
		});

		const embed = new EmbedBuilder()
			.setTitle(`${interaction.user.tag}'s Bank Statement`)
			.setDescription(transactions.length ? transactions.join('\n') : 'No transactions found.')
			.setFooter({ text: 'For a more comprehensive list visit the website (coming soon)' });

		await interaction.editReply({ embeds: [embed] });
	}
}
