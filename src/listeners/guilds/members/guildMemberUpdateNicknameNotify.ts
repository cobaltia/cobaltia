import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { EmbedBuilder, bold, type GuildMember } from 'discord.js';
import { getGuild } from '#lib/database';
import { Colors } from '#util/constants';
import { getTag } from '#util/discord-utilities';

export class GuildMemberUpdateNicknameNotifyListener extends Listener<typeof Events.GuildMemberUpdate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildMemberUpdate,
		});
	}

	public async run(previous: GuildMember, next: GuildMember) {
		const result = await Result.fromAsync(async () => getGuild(next.guild.id));

		await result.match({
			ok: async data => this.handleOk(previous, next, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(previous: GuildMember, next: GuildMember, { logChannelId }: PrismaGuild) {
		if (!logChannelId) return;

		if (previous.nickname === next.nickname) return;
		const prevNickname = previous.nickname;
		const nextNickname = next.nickname;

		const channel = next.guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(next, prevNickname, nextNickname)] });
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(member: GuildMember, prevNickname: string | null, nextNickname: string | null) {
		const icon = member.user.displayAvatarURL({ extension: 'png', forceStatic: false });
		return new EmbedBuilder()
			.setAuthor({ name: getTag(member.user), iconURL: icon })
			.setTitle('Nickname Update')
			.setDescription(
				`Old nickname: ${bold(prevNickname ?? 'None')}\nNew Nickname: ${bold(nextNickname ?? 'None')}`,
			)
			.setFooter({ text: `User ID: ${member.id}` })
			.setColor(Colors.Blue)
			.setTimestamp();
	}
}
