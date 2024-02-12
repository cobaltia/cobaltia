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
		const input = new TextInputBuilder()
			.setLabel('Amount')
			.setCustomId('input:bank:transfer')
			.setPlaceholder('A number such as "1234", "2k", "20%", or "max')
			.setRequired(true)
			.setStyle(TextInputStyle.Short);

		const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
		modal.addComponents(actionRow);

		await interaction.showModal(modal);
	}
}
