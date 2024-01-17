import { Prisma, type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { EmbedBuilder, time, type GuildMember, TimestampStyles, bold } from 'discord.js';
import { Colors } from '#lib/util/constants';
import { getTag } from '#lib/util/util';

export class GuildMemberAddListener extends Listener<typeof Events.GuildMemberAdd> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildMemberAdd,
		});
	}

	public async run(member: GuildMember) {
		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.findUniqueOrThrow({ where: { id: member.guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(member, data),
			err: async error => this.handleDbErr(error, member),
		});
	}

	private async handleOk(member: GuildMember, { logChannelId }: PrismaGuild) {
		const { guild } = member;
		if (!logChannelId) return this.handleErr(new Error(`Could not fine log channel set for ${member.guild.name}`));

		const channel = guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(member)] });
	}

	private async handleDbErr(error: unknown, member: GuildMember) {
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'))
			return this.handleErr(error);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.create({ data: { id: member.guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(member, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(member: GuildMember) {
		const icon = member.user.displayAvatarURL({ extension: 'png', forceStatic: false });
		const created = new Date(member.user.createdTimestamp);
		return new EmbedBuilder()
			.setAuthor({ name: getTag(member.user), iconURL: icon })
			.setTitle('New Member Joined')
			.setDescription(
				`Registered ${bold(time(created, TimestampStyles.RelativeTime))} on ${bold(
					time(created, TimestampStyles.LongDate),
				)}\nGuild Member Count: ${bold(`${member.guild.memberCount}`)}`,
			)
			.setFooter({ text: `User ID: ${member.id}` })
			.setColor(Colors.Green)
			.setTimestamp();
	}
}
