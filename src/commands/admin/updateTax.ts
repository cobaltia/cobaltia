import { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';
import { generatePoll } from '#lib/util/discord-utilities';

export class UpdateTaxCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Update the tax rate.',
			preconditions: ['GuildOnly', 'CobaltOnly'],
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addIntegerOption(option =>
					option
						.setName('tax')
						.setDescription('The new tax rate.')
						.setMinValue(1)
						.setMaxValue(100)
						.setRequired(true),
				)
				.addIntegerOption(option =>
					option
						.setName('duration')
						.setDescription('How long the vote should take in hours')
						.setMinValue(1)
						.setMaxValue(128)
						.setRequired(true),
				),
		);
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const tax = interaction.options.getInteger('tax', true);
		const duration = interaction.options.getInteger('duration', true);
		const prompt = `Update the tax rate to ${tax}%?`;
		const poll = generatePoll(prompt, duration);
		await interaction.reply({ poll });
	}
}
