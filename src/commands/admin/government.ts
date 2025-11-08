import { Subcommand } from '@sapphire/plugin-subcommands';

export class GovernmentCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'Government related commands.',
			preconditions: ['GuildOnly', 'CobaltOnly'],
			subcommands: [{ name: 'set' }],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(builder =>
			builder.setName(this.name).setDescription(this.description).setDefaultMemberPermissions(0),
		);
	}

	public;
}
