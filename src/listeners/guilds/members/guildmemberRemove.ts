import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { EmbedBuilder, bold, type GuildMember, TimestampStyles, time } from 'discord.js';
import { getGuild } from '#lib/database';
import { Colors } from '#lib/util/constants';
import { getTag } from '#lib/util/discord-utilities';

export class GuildMemberRemoveListener extends Listener<typeof Events.GuildMemberRemove> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildMemberRemove,
		});
	}

	public async run(member: GuildMember) {
		const result = await Result.fromAsync(async () => getGuild(member.guild.id));

		await result.match({
			ok: async data => this.handleOk(member, data),
			err: async error => this.handleErr(error),
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

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(member: GuildMember) {
		const icon = member.user.displayAvatarURL({ extension: 'png', forceStatic: false });
		const joined = member.joinedAt!;
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
