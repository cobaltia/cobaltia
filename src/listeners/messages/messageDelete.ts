import { Prisma, type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { EmbedBuilder, type Message } from 'discord.js';
import type { GuildMessage } from '#lib/types';
import { Colors } from '#lib/util/constants';
import { getContent, getImage, isGuildMessage } from '#lib/util/discord-utilities';
import { getTag } from '#lib/util/util';

export class MessageDeleteListener extends Listener<typeof Events.MessageDelete> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			name: Events.MessageDelete,
		});
	}

	public async run(message: Message) {
		if (message.partial || !isGuildMessage(message)) return;

		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.findUniqueOrThrow({ where: { id: message.guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(message, data),
			err: async error => this.handleDbErr(error, message),
		});
	}

	private async handleOk(message: GuildMessage, { logChannelId }: PrismaGuild) {
		if (!logChannelId) return this.handleErr(new Error(`Could not fine log channel set for ${message.guild.name}`));

		const channel = message.guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(message)] });
	}

	private async handleDbErr(error: unknown, message: GuildMessage) {
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'))
			return this.handleErr(error);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.create({ data: { id: message.guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(message, data),
			err: async error => this.handleDbErr(error, message),
		});
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(message: GuildMessage) {
		const icon = message.author.displayAvatarURL({ extension: 'png', forceStatic: false });
		const embed = new EmbedBuilder()
			.setAuthor({ name: getTag(message.author), iconURL: icon })
			.setTitle('Message Deleted')
			.addFields([{ name: 'Text Channel', value: `${message.channel}` }])
			.setFooter({ text: `Message ID: ${message.id}` })
			.setColor(Colors.Red)
			.setTimestamp();

		const content = getContent(message);
		if (!isNullishOrEmpty(content)) embed.setDescription(content);
		const image = getImage(message);
		if (!isNullish(image)) embed.setImage(image);

		return embed;
	}
}
