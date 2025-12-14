import { Command, Result } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';

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
		const eventName = interaction.options.getString('event', true);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.event.findFirst({ where: { name: eventName } }),
		);
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		if (!data) return interaction.reply({ content: `Event "${eventName}" not found.`, ephemeral: true });

		const event = this.container.stores.get('events').get(eventName);
		if (!event) {
			return interaction.reply({ content: `Event "${eventName}" is not runnable.`, ephemeral: true });
		}

		return event.run!(interaction);
	}
}
