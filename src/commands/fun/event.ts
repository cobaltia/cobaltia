import { Command } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { Events } from '#lib/types';

export class EventCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Event games.',
			cooldownDelay: Time.Second,
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option =>
					option.setName('event').setDescription('The event to play').setRequired(true),
				),
		);
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const event = interaction.options.getString('event', true);

		this.container.client.emit(Events.EventRequestReceived, event, interaction);
	}
}
