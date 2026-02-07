import { Events, Listener } from '@sapphire/framework';
import { type Message } from 'discord.js';
import { isGuildMessage } from '#lib/util/discord-utilities';

export class MessageCreateMetric extends Listener<typeof Events.MessageCreate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessageCreate,
		});
	}

	public run(message: Message) {
		if (message.author.bot || !isGuildMessage(message) || message.system || message.webhookId !== null) return;
		this.container.analytics.recordMessage({
			userId: message.author.id,
			guildId: message.guildId,
			channelId: message.channelId,
		});
	}
}
