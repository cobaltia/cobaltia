import { InteractionHandler, InteractionHandlerTypes, Result, UserError } from '@sapphire/framework';
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
import { handleDeposit, handleWithdraw } from '#util/economy';

export class BankModalHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
		});
	}

	public override parse(interaction: ModalSubmitInteraction) {
		const ids = new Set(['modal:bank:deposit', 'modal:bank:withdraw']);
		if (!ids.has(interaction.customId)) return this.none();

		return this.some();
	}

	public async run(interaction: ModalSubmitInteraction) {
		if (interaction.customId === 'modal:bank:deposit') return this.handleDeposit(interaction);
		if (interaction.customId === 'modal:bank:withdraw') return this.handleWithdraw(interaction);
	}

	private async handleDeposit(interaction: ModalSubmitInteraction) {
		await interaction.deferUpdate();

		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) {
			return this.handleErr(interaction, result.unwrapErr());
		}

		const amount = interaction.fields.getTextInputValue('input:bank:deposit');
		const data = result.unwrap();
		const nextResult = await Result.fromAsync(async () => handleDeposit(data, amount));
		if (nextResult.isErr()) {
			return this.handleErr(interaction, nextResult.unwrapErr());
		}

		const { next } = nextResult.unwrap();
		const embed = new EmbedBuilder()
			.setTitle(`${interaction.user.tag}'s Bank Balance`)
			.setFields(
				{ name: 'Wallet', value: formatMoney(next.wallet)!, inline: true },
				{ name: 'Bank', value: formatMoney(next.bankBalance)!, inline: true },
				{ name: 'Bank Space', value: formatMoney(next.bankLimit)!, inline: true },
				{ name: 'Total Net', value: formatMoney(next.wallet + next.bankBalance)!, inline: true },
			);

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Deposit')
					.setCustomId(`button:bank:deposit:${interaction.user.id}`)
					.setDisabled(next.wallet === 0),
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Withdraw')
					.setCustomId(`button:bank:withdraw:${interaction.user.id}`)
					.setDisabled(next.bankBalance === 0),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleWithdraw(interaction: ModalSubmitInteraction) {
		await interaction.deferUpdate();

		const result = await Result.fromAsync(async () => getUser(interaction.user.id));
		if (result.isErr()) {
			return this.handleErr(interaction, result.unwrapErr());
		}

		const amount = interaction.fields.getTextInputValue('input:bank:withdraw');
		const data = result.unwrap();
		const nextResult = await Result.fromAsync(async () => handleWithdraw(data, amount));
		if (nextResult.isErr()) {
			return this.handleErr(interaction, nextResult.unwrapErr());
		}

		const { next } = nextResult.unwrap();
		const embed = new EmbedBuilder()
			.setTitle(`${interaction.user.tag}'s Bank Balance`)
			.setFields(
				{ name: 'Wallet', value: formatMoney(next.wallet)!, inline: true },
				{ name: 'Bank', value: formatMoney(next.bankBalance)!, inline: true },
				{ name: 'Bank Space', value: formatMoney(next.bankLimit)!, inline: true },
				{ name: 'Total Net', value: formatMoney(next.wallet + next.bankBalance)!, inline: true },
			);

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Deposit')
					.setCustomId(`button:bank:deposit:${interaction.user.id}`)
					.setDisabled(next.wallet === 0),
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Withdraw')
					.setCustomId(`button:bank:withdraw:${interaction.user.id}`)
					.setDisabled(next.bankBalance === 0),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleErr(interaction: ModalSubmitInteraction, error: unknown) {
		this.container.logger.error(error);
		await interaction.editReply("Something went wrong. It's so over.....");
		if (error instanceof UserError) await interaction.followUp({ content: error.message, ephemeral: true });
	}
}
