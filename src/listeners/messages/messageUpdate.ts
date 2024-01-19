import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { EmbedBuilder, type Message } from 'discord.js';
import { getGuild } from '#lib/database';
import type { GuildMessage } from '#lib/types';
import { getDifference } from '#lib/util/common';
import { Colors } from '#lib/util/constants';
import { isGuildMessage } from '#lib/util/discord-utilities';
import { getTag } from '#lib/util/util';

export class MessageUpdateListener extends Listener<typeof Events.MessageUpdate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessageUpdate,
		});
	}

	public async run(old: Message, message: Message) {
		// TODO(Isidro): old.content is nullable which breaks the bot
		if (!isGuildMessage(message) || old.content === message.content) return;

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

		return new EmbedBuilder()
			.setAuthor({ name: getTag(message.author), iconURL: icon })
			.setTitle('Message Edited')
			.setDescription(getDifference(old.content, message.content))
			.setColor(Colors.Yellow)
			.setTimestamp();
	}
}
