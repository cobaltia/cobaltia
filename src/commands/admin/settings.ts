/* eslint-disable @typescript-eslint/no-base-to-string */
import { Command, Result } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	PermissionFlagsBits,
	type MessageActionRowComponentBuilder,
} from 'discord.js';
import { getGuild } from '#lib/database';

export class SettingsCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Guild settings.',
			preconditions: ['GuildOnly'],
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		);
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		const { guild } = interaction;
		const result = await Result.fromAsync(async () => getGuild(guild!.id));
		if (result.isErr()) throw result.unwrapErr();
		const { logChannelId, welcomeChannelId, voiceChannelId } = result.unwrap();

		const logChannel = logChannelId ? await guild?.channels.fetch(logChannelId) : null;
		const welcomeChannel = welcomeChannelId ? await guild?.channels.fetch(welcomeChannelId) : null;
		const voiceChannel = voiceChannelId ? await guild?.channels.fetch(voiceChannelId) : null;
		const description = [
			`Log Channel: ${logChannel ?? 'Disabled'}`,
			`Welcome Channel: ${welcomeChannel ?? 'Disabled'}`,
			`Voice Channel: ${voiceChannel ?? 'Disabled'}`,
		];

		const embed = new EmbedBuilder()
			.setTitle(`${interaction.guild?.name}'s Settings`)
			.setDescription(description.join('\n'))
			.setFooter({ text: 'To reenable run the setup command again' });

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(logChannel ? ButtonStyle.Danger : ButtonStyle.Secondary)
					.setLabel(logChannel ? 'Disable Logging' : 'Logging disabled')
					.setCustomId(`button:settings:log-${logChannel ? 'disable' : 'enable'}`)
					.setDisabled(!logChannel),
				new ButtonBuilder()
					.setStyle(welcomeChannel ? ButtonStyle.Danger : ButtonStyle.Secondary)
					.setLabel(welcomeChannel ? 'Disable Welcome Message' : 'Welcome Message disabled')
					.setCustomId(`button:settings:welcome-${welcomeChannel ? 'disable' : 'enable'}`)
					.setDisabled(!welcomeChannel),
				new ButtonBuilder()
					.setStyle(voiceChannel ? ButtonStyle.Danger : ButtonStyle.Secondary)
					.setLabel(voiceChannel ? 'Disable Voice Message' : 'Voice Message disabled')
					.setCustomId(`button:settings:voice-${voiceChannel ? 'disable' : 'enable'}`)
					.setDisabled(!voiceChannel),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}
}
