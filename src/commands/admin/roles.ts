import { Command } from '@sapphire/framework';
import {
	ActionRowBuilder,
	type MessageActionRowComponentBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
	StringSelectMenuBuilder,
} from 'discord.js';
import { ROLES } from '#lib/util/constants';

export class RolesCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Guild roles.',
			preconditions: ['GuildOnly', 'CobaltOnly'],
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
		await interaction.deferReply();

		const embed = new EmbedBuilder()
			.setTitle('Roles Menu')
			.setDescription('Below you can select the roles you want.')
			.setImage('https://cdn.discordapp.com/attachments/322506908390916096/361315940995956736/image.png');

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId('select-menu:roles')
					.addOptions(...ROLES)
					.setMaxValues(22),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}
}
