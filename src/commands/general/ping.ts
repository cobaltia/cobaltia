import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import { channelMention, MessageFlags } from 'discord.js';

export class PingCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Ping the bot.',
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => builder.setName(this.name).setDescription(this.description));
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const owned = channelMention('770680135883554836');
		const msg = await interaction.reply({
			content: `If you see this then get ${owned}`,
			flags: MessageFlags.Ephemeral,
			fetchReply: true,
		});
		if (isMessageInstance(msg)) {
			const diff = msg.createdTimestamp - interaction.createdTimestamp;
			const ping = Math.round(this.container.client.ws.ping);
			return interaction.editReply(`Pong! Latency: ${diff}ms. API Latency: ${ping}ms`);
		}

		return interaction.editReply("Failed to retrieve ping, it's so over......");
	}
}
