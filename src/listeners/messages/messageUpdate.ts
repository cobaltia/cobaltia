import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { EmbedBuilder, type Message } from 'discord.js';
import { getGuild } from '#lib/database';
import type { GuildMessage } from '#lib/types';
import { getDifference } from '#lib/util/common';
import { Colors } from '#lib/util/constants';
import { getImage, isGuildMessage } from '#lib/util/discord-utilities';
import { getTag } from '#lib/util/util';

export class MessageUpdateListener extends Listener<typeof Events.MessageUpdate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessageUpdate,
		});
	}

	public async run(old: Message, message: Message) {
		if (isNullish(old.content) || !isGuildMessage(message) || old.content === message.content) return;

		const result = await Result.fromAsync(async () => getGuild(message.guild.id));

		await result.match({
			ok: async data => this.handleOk(old, message, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(old: Message, message: GuildMessage, { logChannelId }: PrismaGuild) {
		if (!logChannelId) return this.handleErr(new Error(`Could not fine log channel set for ${message.guild.name}`));

		const channel = message.guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(old, message)] });
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(old: Message, message: GuildMessage) {
		const icon = message.author.displayAvatarURL({ extension: 'png', forceStatic: false });

		const embed = new EmbedBuilder()
			.setAuthor({ name: getTag(message.author), iconURL: icon })
			.setTitle('Message Edited')
			.setDescription(this.buildDescription(old, message))
			.setColor(Colors.Yellow)
			.setTimestamp();

		const image = getImage(message);
		if (!isNullish(image)) embed.setImage(image);

		return embed;
	}

	private buildDescription(old: Message, message: GuildMessage) {
		// TODO(Isidro): Trim the message content if it's too long
		const description = [`[Jump to message](${message.url})`, getDifference(old.content, message.content)];
		return description.join('\n');
	}
}