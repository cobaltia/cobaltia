import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import type { Nullish } from '@sapphire/utilities';
import {
	type Guild,
	type GuildBan,
	type User,
	PermissionFlagsBits,
	AuditLogEvent,
	EmbedBuilder,
	type GuildAuditLogsEntry,
} from 'discord.js';
import { getGuild } from '#lib/database';
import { Colors } from '#util/constants';
import { getTag } from '#util/discord-utilities';

export class GuildBanAddListener extends Listener<typeof Events.GuildBanAdd> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildBanAdd,
		});
	}

	public async run({ guild, user, reason }: GuildBan) {
		const result = await Result.fromAsync(async () => getGuild(guild.id));

		await result.match({
			ok: async data => this.handleOk(user, guild, reason, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(user: User, guild: Guild, reason: Nullish | string, { logChannelId }: PrismaGuild) {
		if (!logChannelId) return;

		let audit;
		if (guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
			audit = (await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd })).entries.first();
		}

		const channel = guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(user, reason, audit)] });
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(user: User, reason: Nullish | string, audit: GuildAuditLogsEntry | Nullish): EmbedBuilder {
		const icon = user.displayAvatarURL({ extension: 'png', forceStatic: false });
		const description = [`**Reason:** ${reason ?? audit?.reason ?? 'No reason provided'}`];
		if (audit?.executor) description.push(`**Executor:** ${audit.executor}`);
		return new EmbedBuilder()
			.setAuthor({ name: getTag(user), iconURL: icon })
			.setTitle('Member Banned')
			.setDescription(description.join('\n'))
			.setFooter({ text: `User ID: ${user.id}` })
			.setColor(Colors.Red)
			.setTimestamp();
	}
}
