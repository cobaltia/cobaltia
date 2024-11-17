import { type ApplicationCommandRegistry } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { Events } from '#lib/types';

export class ItemCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'A command to interact with items.',
			subcommands: [
				{ name: 'use', chatInputRun: 'chatInputUse' },
				{ name: 'sell', chatInputRun: 'chatInputSell' },
			],
		});
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand(command =>
					command
						.setName('use')
						.setDescription('Use an Item')
						.addStringOption(option => option.setName('item').setDescription('Item to use').setRequired(true))
						.addIntegerOption(option => option.setName('amount').setDescription('Amount of items to use')),
				)
				.addSubcommand(command =>
					command
						.setName('sell')
						.setDescription('Sell an Item')
						.addStringOption(option => option.setName('item').setDescription('Item to sell').setRequired(true))
						.addIntegerOption(option => option.setName('amount').setDescription('Amount of items to sell')),
				),
		);
	}

	public async chatInputUse(interaction: Subcommand.ChatInputCommandInteraction) {
		const item = interaction.options.getString('item', true);

		this.container.client.emit(Events.PossibleItem, item, interaction);
	}

	public async chatInputSell(interaction: Subcommand.ChatInputCommandInteraction) {
		return interaction.reply('This command is not yet implemented.');
	}
}
