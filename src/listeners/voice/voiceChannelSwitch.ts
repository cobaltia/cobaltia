import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Listener, Result } from '@sapphire/framework';
import { EmbedBuilder, bold, type VoiceState } from 'discord.js';
import { getGuild } from '#lib/database';
import { Events } from '#lib/types';
import { Colors } from '#util/constants';
import { getTag } from '#util/discord-utilities';

export class VoiceChannelSwitchListener extends Listener<typeof Events.VoiceChannelSwitch> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.VoiceChannelSwitch,
		});
	}

	public async run(previous: VoiceState, next: VoiceState) {
		const result = await Result.fromAsync(async () => getGuild(next.guild.id));

		await result.match({
			ok: async data => this.handleOk(previous, next, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(previous: VoiceState, next: VoiceState, { logChannelId }: PrismaGuild) {
		const { guild } = next;
		if (!logChannelId) return;

		const channel = guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(previous, next)] });
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(previous: VoiceState, next: VoiceState) {
		const member = next.member!;
		const icon = member.user.displayAvatarURL({ extension: 'png', forceStatic: false });
		return new EmbedBuilder()
			.setAuthor({ name: getTag(member.user), iconURL: icon })
			.setTitle('Member Switched VC')
			.setDescription(this.buildDescription(previous, next))
			.setFooter({ text: `User ID: ${member.id}` })
			.setColor(Colors.Black)
			.setTimestamp();
	}

	private buildDescription(previous: VoiceState, next: VoiceState) {
		const description = [`${bold('From')}: ${previous.channel}`, `${bold('To')}: ${next.channel}`];
		return description.join('\n');
	}
}
