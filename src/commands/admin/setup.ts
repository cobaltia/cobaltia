/* eslint-disable @typescript-eslint/no-base-to-string */
import { Subcommand } from '@sapphire/plugin-subcommands';
import { MessageFlags, PermissionFlagsBits } from 'discord.js';

export class SetupCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'Set Up',
			preconditions: ['GuildOnly'],
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
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const previous = await this.container.prisma.guild.findUnique({ where: { id: interaction.guild!.id } });

		await this.container.prisma.guild.upsert({
			where: { id: interaction.guild!.id },
			update: { logChannelId: channel.id },
			create: { id: interaction.guild!.id, logChannelId: channel.id },
		});

		this.container.analytics.audit({
			action: 'GUILD_SETTING_UPDATED',
			userId: interaction.user.id,
			guildId: interaction.guild!.id,
			targetId: channel.id,
			targetType: 'channel',
			metadata: `logChannelId: ${previous?.logChannelId ?? 'none'} → ${channel.id}`,
		});

		await interaction.editReply({ content: `Set ${channel} as new log channel!` });
	}

	public async chatInputWelcome(interaction: Subcommand.ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel('channel', true);
		const message = interaction.options.getString('message') ?? undefined;
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const previous = await this.container.prisma.guild.findUnique({ where: { id: interaction.guild!.id } });

		await this.container.prisma.guild.upsert({
			where: { id: interaction.guild!.id },
			update: { welcomeChannelId: channel.id, welcomeMessage: message },
			create: { id: interaction.guild!.id, welcomeChannelId: channel.id, welcomeMessage: message },
		});

		const changes = [`welcomeChannelId: ${previous?.welcomeChannelId ?? 'none'} → ${channel.id}`];
		if (message) changes.push(`welcomeMessage: ${previous?.welcomeMessage ?? 'none'} → ${message}`);
		this.container.analytics.audit({
			action: 'GUILD_SETTING_UPDATED',
			userId: interaction.user.id,
			guildId: interaction.guild!.id,
			targetId: channel.id,
			targetType: 'channel',
			metadata: changes.join(', ').slice(0, 255),
		});

		await interaction.editReply({ content: `Set ${channel} as new welcome channel` });
	}

	public async chatInputVoice(interaction: Subcommand.ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel('channel', true);
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const previous = await this.container.prisma.guild.findUnique({ where: { id: interaction.guild!.id } });

		await this.container.prisma.guild.upsert({
			where: { id: interaction.guild!.id },
			update: { voiceChannelId: channel.id },
			create: { id: interaction.guild!.id, voiceChannelId: channel.id },
		});

		this.container.analytics.audit({
			action: 'GUILD_SETTING_UPDATED',
			userId: interaction.user.id,
			guildId: interaction.guild!.id,
			targetId: channel.id,
			targetType: 'channel',
			metadata: `voiceChannelId: ${previous?.voiceChannelId ?? 'none'} → ${channel.id}`,
		});

		await interaction.editReply({ content: `Set ${channel} as new voice channel` });
	}
}
