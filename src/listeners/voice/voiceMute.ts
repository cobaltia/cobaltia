import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Listener, Result } from '@sapphire/framework';
import { EmbedBuilder, bold, type GuildMember, type VoiceState } from 'discord.js';
import { getGuild } from '#lib/database';
import { Events } from '#lib/types';
import { Colors } from '#util/constants';
import { getTag } from '#util/discord-utilities';

export class VoiceMuteListener extends Listener<typeof Events.VoiceMute> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.VoiceMute,
		});
	}

	public async run(member: GuildMember, next: VoiceState) {
		const result = await Result.fromAsync(async () => getGuild(next.guild.id));

		await result.match({
			ok: async data => this.handleOk(member, next, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(member: GuildMember, next: VoiceState, { logChannelId }: PrismaGuild) {
		const { guild } = next;
		if (!logChannelId) return;

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
			.setTitle(next.selfMute ? 'Member Self Muted' : 'Member Muted')
			.setDescription(`${bold('VC Channel')}: ${next.channel}`)
			.setFooter({ text: `User ID: ${member.id}` })
			.setColor(next.selfMute ? Colors.Black : Colors.Red)
			.setTimestamp();
	}
}
