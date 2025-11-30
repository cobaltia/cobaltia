import { Command, UserError } from '@sapphire/framework';
import { ActionRowBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export class TransferCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Transfer money to another user.',
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerContextMenuCommand(builder =>
			builder.setName('Transfer Money').setType(ApplicationCommandType.User),
		);
	}

	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		if (interaction.targetId === interaction.user.id) {
			throw new UserError({ identifier: 'SelfTransfer', message: 'You cannot transfer money to yourself.' });
		}

		const modal = new ModalBuilder()
			.setCustomId(`modal:bank:transfer:${interaction.targetId}`)
			.setTitle('Transfer');
		const amount = new TextInputBuilder()
			.setLabel('Amount')
			.setCustomId('input:bank:transfer')
			.setPlaceholder('A number such as "1234", "2k", "20%", or "max"')
			.setRequired(true)
			.setStyle(TextInputStyle.Short);
		const reason = new TextInputBuilder()
			.setLabel('Reason')
			.setCustomId('input:bank:transfer-reason')
			.setPlaceholder('Optional reason for the transfer')
			.setRequired(false)
			.setStyle(TextInputStyle.Short);

		const amountRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amount);
		const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reason);
		modal.addComponents(amountRow, reasonRow);

		await interaction.showModal(modal);
	}
}
