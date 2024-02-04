import { Identifiers, InteractionHandler, InteractionHandlerTypes, UserError } from '@sapphire/framework';
import { ModalBuilder, type ButtonInteraction, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export class BankButtonHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Button,
		});
	}

	public override parse(interaction: ButtonInteraction) {
		const customId = interaction.customId;
		const userId = customId.split(':')[3];
		if (customId.startsWith('button:bank:deposit')) return this.some({ userId });
		if (customId.startsWith('button:bank:withdraw')) return this.some({ userId });

		return this.none();
	}

	public async run(interaction: ButtonInteraction, result: InteractionHandler.ParseResult<this>) {
		const userId = result.userId;
		if (userId !== interaction.user.id)
			throw new UserError({
				identifier: Identifiers.ArgumentUserError,
				message: "You cannot interact with someone else's bank.",
			});
		if (interaction.customId.startsWith('button:bank:deposit')) return this.handleDeposit(interaction);
		if (interaction.customId.startsWith('button:bank:withdraw')) return this.handleWithdraw(interaction);
	}

	private async handleDeposit(interaction: ButtonInteraction) {
		const modal = new ModalBuilder().setCustomId('modal:bank:deposit').setTitle('Deposit');
		const input = new TextInputBuilder()
			.setLabel('Amount')
			.setCustomId('input:bank:deposit')
			.setPlaceholder('A number such as "1234", "2k", "20%", or "max"')
			.setRequired(true)
			.setStyle(TextInputStyle.Short);
		const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
		modal.addComponents(actionRow);

		await interaction.showModal(modal);
	}

	private async handleWithdraw(interaction: ButtonInteraction) {
		const modal = new ModalBuilder().setCustomId('modal:bank:withdraw').setTitle('Withdraw');
		const input = new TextInputBuilder()
			.setLabel('Amount')
			.setCustomId('input:bank:withdraw')
			.setPlaceholder('A number such as "1234", "2k", "20%", or "max"')
			.setRequired(true)
			.setStyle(TextInputStyle.Short);
		const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
		modal.addComponents(actionRow);

		await interaction.showModal(modal);
	}
}
