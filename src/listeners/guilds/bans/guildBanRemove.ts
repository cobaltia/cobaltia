import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { type Guild, type GuildBan, type User, EmbedBuilder } from 'discord.js';
import { getGuild } from '#lib/database';
import { Colors } from '#util/constants';
import { getTag } from '#util/discord-utilities';

export class GuildBanRemoveListener extends Listener<typeof Events.GuildBanRemove> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildBanRemove,
		});
	}

	public async run({ guild, user }: GuildBan) {
		const result = await Result.fromAsync(async () => getGuild(guild.id));
		await result.match({
			ok: async data => this.handleOk(user, guild, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(user: User, guild: Guild, { logChannelId }: PrismaGuild) {
		if (!logChannelId) return this.handleErr(new Error(`Could not fine log channel set for ${guild.name}`));

		const channel = guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(user, guild)] });
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(user: User, _guild: Guild) {
		const icon = user.displayAvatarURL({ extension: 'png', forceStatic: false });
		return new EmbedBuilder()
			.setAuthor({ name: getTag(user), iconURL: icon })
			.setTitle('User unbanned')
			.setFooter({ text: `User ID: ${user.id}` })
			.setColor(Colors.Blue)
			.setTimestamp();
	}
}
