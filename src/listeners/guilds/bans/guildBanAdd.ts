import { Prisma, type Guild as PrismaGuild } from '@prisma/client';
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
import { Colors } from '#lib/util/constants';
import { getTag } from '#lib/util/util';

export class GuildBanAddListener extends Listener<typeof Events.GuildBanAdd> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildBanAdd,
		});
	}

	public async run({ guild, user, reason }: GuildBan) {
		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.findUniqueOrThrow({ where: { id: guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(user, guild, reason, data),
			err: async error => this.handleDbErr(error, user, guild, reason),
		});
	}

	private async handleOk(user: User, guild: Guild, reason: Nullish | string, { logChannelId }: PrismaGuild) {
		if (!logChannelId) return this.handleErr(new Error(`Could not fine log channel set for ${guild.name}`));

		let audit;
		if (guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
			audit = (await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd })).entries.first();
		}

		const channel = guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(user, reason, audit)] });
	}

	private async handleDbErr(error: unknown, user: User, guild: Guild, reason: Nullish | string) {
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'))
			return this.handleErr(error);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.create({ data: { id: guild.id } }),
		);
		await result.match({
			ok: async data => this.handleOk(user, guild, reason, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(user: User, reason: Nullish | string, audit: GuildAuditLogsEntry | Nullish): EmbedBuilder {
		const icon = user.displayAvatarURL({ extension: 'png', forceStatic: false });
		return new EmbedBuilder()
			.setAuthor({ name: getTag(user), iconURL: icon })
			.setTitle('Member Banned')
			.setDescription(`**Reason:** ${reason ?? audit?.reason ?? 'No reason provided'}`)
			.setFooter({ text: `User ID: ${user.id}` })
			.setColor(Colors.Red)
			.setTimestamp();
	}
}