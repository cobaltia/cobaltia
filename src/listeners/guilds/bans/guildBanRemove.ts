import { Prisma, type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { type Guild, type GuildBan, type User, EmbedBuilder } from 'discord.js';
import { Colors } from '#lib/util/constants';

export class GuildBanRemoveListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildBanRemove,
		});
	}

	public async run({ guild, user }: GuildBan) {
		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.findUniqueOrThrow({ where: { id: guild.id } }),
		);
		await result.match({
			ok: async data => this.handleOk(user, guild, data),
			err: async error => this.handleDbErr(error, user, guild),
		});
	}

	private async handleOk(user: User, guild: Guild, { logChannelId }: PrismaGuild) {
		if (!logChannelId) return this.handleErr(new Error(`Could not fine log channel set for ${guild.name}`));

		const channel = guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(user, guild)] });
	}

	private async handleDbErr(error: unknown, user: User, guild: Guild) {
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'))
			return this.handleErr(error);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.create({ data: { id: guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(user, guild, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(user: User, _guild: Guild) {
		const icon = user.displayAvatarURL({ extension: 'png', forceStatic: false });
		return new EmbedBuilder()
			.setAuthor({ name: user.username, iconURL: icon })
			.setTitle('User unbanned')
			.setFooter({ text: `User ID: ${user.id}` })
			.setColor(Colors.Blue)
			.setTimestamp();
	}
}
