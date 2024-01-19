import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Listener, Result } from '@sapphire/framework';
import { EmbedBuilder, bold, type GuildMember, type VoiceState } from 'discord.js';
import { getGuild } from '#lib/database';
import { Events } from '#lib/types';
import { Colors } from '#lib/util/constants';
import { getTag } from '#lib/util/util';

export class VoiceChannelJoinListener extends Listener<typeof Events.VoiceChannelJoin> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.VoiceChannelJoin,
		});
	}

	public async run(member: GuildMember, next: VoiceState) {
		const result = await Result.fromAsync(async () => getGuild(member.guild.id));

		await result.match({
			ok: async data => this.handleOk(member, next, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(member: GuildMember, next: VoiceState, { logChannelId }: PrismaGuild) {
		const { guild } = member;
		if (!logChannelId) return this.handleErr(new Error(`Could not fine log channel set for ${member.guild.name}`));

		const channel = guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(member, next)] });
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(member: GuildMember, next: VoiceState) {
		const icon = member.user.displayAvatarURL({ extension: 'png', forceStatic: false });
		return new EmbedBuilder()
			.setAuthor({ name: getTag(member.user), iconURL: icon })
			.setTitle('Member Joined VC')
			.setDescription(`${bold('VC Channel')}: ${next.channel}`)
			.setFooter({ text: `User ID: ${member.id}` })
			.setColor(Colors.Green)
			.setTimestamp();
	}
}
