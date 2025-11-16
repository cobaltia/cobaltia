import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { EmbedBuilder, type Message } from 'discord.js';
import { getGuild } from '#lib/database';
import type { GuildMessage } from '#lib/types';
import { getDifference, truncate } from '#util/common';
import { Colors } from '#util/constants';
import { getImage, getTag, isGuildMessage } from '#util/discord-utilities';

export class MessageUpdateListener extends Listener<typeof Events.MessageUpdate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessageUpdate,
		});
	}

	public async run(old: Message<true>, message: Message<true>) {
		if (isNullish(old.content) || !isGuildMessage(message) || old.content === message.content || message.author.bot)
			return;

		const result = await Result.fromAsync(async () => getGuild(message.guild.id));

		await result.match({
			ok: async data => this.handleOk(old, message, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(old: Message, message: GuildMessage, { logChannelId }: PrismaGuild) {
		if (!logChannelId) return;

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
		const description = [`[Jump to message](${message.url})`, getDifference(old.content, message.content)];
		return truncate(description.join('\n'), 4_096);
	}
}
