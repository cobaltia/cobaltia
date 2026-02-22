import { InteractionHandler, InteractionHandlerTypes, Result } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	type MessageActionRowComponentBuilder,
	type ModalSubmitInteraction,
} from 'discord.js';
import { getUser } from '#lib/database';
import { formatMoney } from '#util/common';
import { handleDeposit, handleTransfer, handleWithdraw } from '#util/economy';

export class BankModalHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
		});
	}

	public override parse(interaction: ModalSubmitInteraction) {
		const customId = interaction.customId;
		if (customId === 'modal:bank:deposit') return this.some();
		if (customId === 'modal:bank:withdraw') return this.some();
		if (customId.startsWith('modal:bank:transfer')) return this.some({ targetId: customId.split(':')[3] });

		return this.none();
	}

	public async run(interaction: ModalSubmitInteraction, result: InteractionHandler.ParseResult<this>) {
		if (interaction.customId === 'modal:bank:deposit') return this.handleDeposit(interaction);
		if (interaction.customId === 'modal:bank:withdraw') return this.handleWithdraw(interaction);
		if (interaction.customId.startsWith('modal:bank:transfer')) return this.handleTransfer(interaction, result);
	}

	private async handleDeposit(interaction: ModalSubmitInteraction) {
		await interaction.deferUpdate();

		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) throw result.unwrapErr();

		const amount = interaction.fields.getTextInputValue('input:bank:deposit');
		const reason = interaction.fields.getTextInputValue('input:bank:deposit-reason');
		const data = result.unwrap();
		const nextResult = await Result.fromAsync(async () => handleDeposit(data, amount));
		if (nextResult.isErr()) throw nextResult.unwrapErr();

		const { next, money } = nextResult.unwrap();
		const description = ['Bank Deposit'];
		if (reason) description.push(reason);
		this.container.analytics.recordMoney({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId ?? 'none',
			command: 'bank deposit',
			reason: 'DEPOSIT',
			amount: money,
			type: 'NEUTRAL',
			description: description.join('. '),
		});

		const embed = new EmbedBuilder()
			.setTitle(`${interaction.user.tag}'s Bank Balance`)
			.setFields(
				{ name: 'Wallet', value: formatMoney(next.wallet)!, inline: true },
				{ name: 'Bank', value: formatMoney(next.bankBalance)!, inline: true },
				{ name: 'Bank Space', value: formatMoney(next.bankLimit)!, inline: true },
				{ name: 'Total Net', value: formatMoney(next.wallet.add(next.bankBalance))!, inline: true },
			);

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Deposit')
					.setCustomId(`button:bank:deposit:${interaction.user.id}`)
					.setDisabled(next.wallet.equals(0)),
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Withdraw')
					.setCustomId(`button:bank:withdraw:${interaction.user.id}`)
					.setDisabled(next.bankBalance.equals(0)),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleWithdraw(interaction: ModalSubmitInteraction) {
		await interaction.deferUpdate();

		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) throw result.unwrapErr();

		const amount = interaction.fields.getTextInputValue('input:bank:withdraw');
		const reason = interaction.fields.getTextInputValue('input:bank:withdraw-reason');
		const data = result.unwrap();
		const nextResult = await Result.fromAsync(async () => handleWithdraw(data, amount));
		if (nextResult.isErr()) throw nextResult.unwrapErr();

		const { next, money } = nextResult.unwrap();
		const description = ['Bank Withdrawal'];
		if (reason) description.push(reason);
		this.container.analytics.recordMoney({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId ?? 'none',
			command: 'bank withdraw',
			reason: 'WITHDRAW',
			amount: money,
			type: 'NEUTRAL',
			description: description.join('. '),
		});

		const embed = new EmbedBuilder()
			.setTitle(`${interaction.user.tag}'s Bank Balance`)
			.setFields(
				{ name: 'Wallet', value: formatMoney(next.wallet)!, inline: true },
				{ name: 'Bank', value: formatMoney(next.bankBalance)!, inline: true },
				{ name: 'Bank Space', value: formatMoney(next.bankLimit)!, inline: true },
				{ name: 'Total Net', value: formatMoney(next.wallet.add(next.bankBalance))!, inline: true },
			);

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Deposit')
					.setCustomId(`button:bank:deposit:${interaction.user.id}`)
					.setDisabled(next.wallet.equals(0)),
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Withdraw')
					.setCustomId(`button:bank:withdraw:${interaction.user.id}`)
					.setDisabled(next.bankBalance.equals(0)),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleTransfer(
		interaction: ModalSubmitInteraction,
		{ targetId }: InteractionHandler.ParseResult<this>,
	) {
		await interaction.deferReply();

		const user = await interaction.client.users.fetch(targetId);

		const transferorResult = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (transferorResult.isErr()) {
			throw transferorResult.unwrapErr();
		}

		const transfereeResult = await Result.fromAsync(async () => getUser(user.id));
		if (transfereeResult.isErr()) {
			throw transfereeResult.unwrapErr();
		}

		const amount = interaction.fields.getTextInputValue('input:bank:transfer');
		const reason = interaction.fields.getTextInputValue('input:bank:transfer-reason');
		const transferor = transferorResult.unwrap();
		const transferee = transfereeResult.unwrap();
		const result = await Result.fromAsync(async () => handleTransfer(transferor, transferee, amount));
		if (result.isErr()) {
			throw result.unwrapErr();
		}

		const { money, transferor: next } = result.unwrap();
		const description = ['Bank Transfer'];
		if (reason) description.push(reason);
		this.container.analytics.recordMoney({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId ?? 'none',
			command: 'bank transfer',
			reason: 'TRANSFER',
			amount: money,
			type: 'LOST',
			description: [...description, `Transfer to ${user.username}`].join('. '),
		});
		this.container.analytics.recordMoney({
			userId: user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId ?? 'none',
			command: 'bank transfer',
			reason: 'DEPOSIT',
			amount: money,
			type: 'EARNED',
			description: [...description, `Transfer from ${interaction.user.username}`].join('. '),
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
}
