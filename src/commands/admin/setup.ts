/* eslint-disable @typescript-eslint/no-base-to-string */
import { Subcommand } from '@sapphire/plugin-subcommands';
import { PermissionFlagsBits } from 'discord.js';

export class SetupCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'Set Up',
			preconditions: [['OwnerOnly', 'ExecutiveOnly'], 'GuildOnly'],
			subcommands: [
				{ name: 'logchannel', chatInputRun: 'chatInputLog' },
				{ name: 'welcomechannel', chatInputRun: 'chatInputWelcome' },
				{ name: 'voicechannel', chatInputRun: 'chatInputVoice' },
			],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addSubcommand(command =>
					command
						.setName('logchannel')
						.setDescription('Setup the log channel.')
						.addChannelOption(option =>
							option.setName('channel').setDescription('The channel to log into.').setRequired(true),
						),
				)
				.addSubcommand(command =>
					command
						.setName('welcomechannel')
						.setDescription('Setup the welcome channel.')
						.addChannelOption(option =>
							option
								.setName('channel')
								.setDescription('The channel to welcome users into.')
								.setRequired(true),
						)
						.addStringOption(option =>
							option
								.setName('message')
								.setDescription(
									'The welcome message to send to new users. {user} and {guild} can be used as placeholders.',
								),
						),
				)
				.addSubcommand(command =>
					command
						.setName('voicechannel')
						.setDescription('Setup the voice chat channel.')
						.addChannelOption(option =>
							option
								.setName('channel')
								.setDescription('The channel to log VC info into.')
								.setRequired(true),
						),
				),
		);
	}

	public async chatInputLog(interaction: Subcommand.ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel('channel', true);
		await interaction.deferReply({ ephemeral: true });

		await this.container.prisma.guild.upsert({
			where: { id: interaction.guild!.id },
			update: { logChannelId: channel.id },
			create: { id: interaction.guild!.id, logChannelId: channel.id },
		});

		await interaction.editReply({ content: `Set ${channel} as new log channel!` });
	}

	public async chatInputWelcome(interaction: Subcommand.ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel('channel', true);
		const message = interaction.options.getString('message') ?? undefined;
		await interaction.deferReply({ ephemeral: true });

		await this.container.prisma.guild.upsert({
			where: { id: interaction.guild!.id },
			update: { welcomeChannelId: channel.id, welcomeMessage: message },
			create: { id: interaction.guild!.id, welcomeChannelId: channel.id, welcomeMessage: message },
		});

		await interaction.editReply({ content: `Set ${channel} as new welcome channel` });
	}

	public async chatInputVoice(interaction: Subcommand.ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel('channel', true);
		await interaction.deferReply({ ephemeral: true });

		await this.container.prisma.guild.upsert({
			where: { id: interaction.guild!.id },
			update: { voiceChannelId: channel.id },
			create: { id: interaction.guild!.id, voiceChannelId: channel.id },
		});

		await interaction.editReply({ content: `Set ${channel} as new voice channel` });
	}
}
