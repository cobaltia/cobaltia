import { InteractionHandler, InteractionHandlerTypes, Result } from '@sapphire/framework';
import {
	EmbedBuilder,
	type ButtonInteraction,
	ActionRowBuilder,
	type MessageActionRowComponentBuilder,
	ButtonStyle,
	ButtonBuilder,
} from 'discord.js';
import { getGuild } from '#lib/database';

export class SettingsButtonHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Button,
		});
	}

	public override parse(interaction: ButtonInteraction) {
		const customId = interaction.customId;
		const setting = customId.split(':')[2];
		if (customId.startsWith('button:settings')) return this.some({ setting });

		return this.none();
	}

	public async run(interaction: ButtonInteraction, result: InteractionHandler.ParseResult<this>) {
		if (result.setting === 'log-disable') return this.handleLogDisable(interaction);
		if (result.setting === 'welcome-disable') return this.handleWelcomeDisable(interaction);
		if (result.setting === 'voice-disable') return this.handleVoiceDisable(interaction);
	}

	private async handleLogDisable(interaction: ButtonInteraction) {
		await interaction.deferUpdate();
		const previous = await this.container.prisma.guild.findUnique({ where: { id: interaction.guild!.id } });
		await this.container.prisma.guild.update({
			where: { id: interaction.guild!.id },
			data: { logChannelId: null },
		});

		this.container.analytics.audit({
			action: 'GUILD_SETTING_UPDATED',
			userId: interaction.user.id,
			guildId: interaction.guild!.id,
			metadata: `logChannelId: ${previous?.logChannelId ?? 'none'} → none`,
		});

		const { embed, components } = await this.buildResponse(interaction);

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleWelcomeDisable(interaction: ButtonInteraction) {
		await interaction.deferUpdate();
		const previous = await this.container.prisma.guild.findUnique({ where: { id: interaction.guild!.id } });
		await this.container.prisma.guild.update({
			where: { id: interaction.guild!.id },
			data: { welcomeChannelId: null },
		});

		this.container.analytics.audit({
			action: 'GUILD_SETTING_UPDATED',
			userId: interaction.user.id,
			guildId: interaction.guild!.id,
			metadata: `welcomeChannelId: ${previous?.welcomeChannelId ?? 'none'} → none`,
		});

		const { embed, components } = await this.buildResponse(interaction);

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleVoiceDisable(interaction: ButtonInteraction) {
		await interaction.deferUpdate();
		const previous = await this.container.prisma.guild.findUnique({ where: { id: interaction.guild!.id } });
		await this.container.prisma.guild.update({
			where: { id: interaction.guild!.id },
			data: { voiceChannelId: null },
		});

		this.container.analytics.audit({
			action: 'GUILD_SETTING_UPDATED',
			userId: interaction.user.id,
			guildId: interaction.guild!.id,
			metadata: `voiceChannelId: ${previous?.voiceChannelId ?? 'none'} → none`,
		});

		const { embed, components } = await this.buildResponse(interaction);

		await interaction.editReply({ embeds: [embed], components });
	}

	private async buildResponse(interaction: ButtonInteraction) {
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
		return { embed, components };
	}
}
