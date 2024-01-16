import { Prisma, type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { EmbedBuilder, bold, type GuildMember, TimestampStyles, time } from 'discord.js';
import { Colors } from '#lib/util/constants';
import { getTag } from '#lib/util/util';

export class GuildMemberRemove extends Listener<typeof Events.GuildMemberRemove> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildMemberRemove,
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
		await this.container.client.users.fetch(member.id);
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
		const joined = new Date(member.guild.joinedTimestamp);
		return new EmbedBuilder()
			.setAuthor({ name: getTag(member.user), iconURL: icon })
			.setTitle('Member Left')
			.setDescription(
				`Joined ${bold(time(joined, TimestampStyles.RelativeTime))} on ${bold(
					time(joined, TimestampStyles.LongDate),
				)}\nGuid Member Count: ${bold(member.guild.memberCount.toLocaleString())}`,
			)
			.setFooter({ text: `User ID: ${member.id}` })
			.setColor(Colors.Red)
			.setTimestamp();
	}
}
