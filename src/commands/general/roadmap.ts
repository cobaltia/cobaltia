import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

export class RoadmapCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: "Get the bot's roadmap.",
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => builder.setName(this.name).setDescription(this.description));
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const url = 'https://juanpablo2655.notion.site/Cobaltia-Roadmap-7101e11def4a44d9ae742c94959304d9';
		const thumbnailUrl =
			'https://cdn.discordapp.com/icons/322505254098698240/a_89498f79b410bcb94c0a0237b3748ad9.gif';
		const description = [
			"Curious about what's coming?",
			`Dive into our roadmap link and get a sneak peek [here](${url})!`,
		];
		const embed = new EmbedBuilder()
			.setTitle('Cobaltia Roadmap')
			.setDescription(description.join('\n'))
			.setThumbnail(thumbnailUrl);
		return interaction.reply({ embeds: [embed] });
	}
}
