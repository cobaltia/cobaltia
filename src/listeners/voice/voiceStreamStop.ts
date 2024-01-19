import { Prisma, type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Listener, Result } from '@sapphire/framework';
import { EmbedBuilder, bold, type GuildMember, type VoiceState } from 'discord.js';
import { Events } from '#lib/types';
import { Colors } from '#lib/util/constants';
import { getTag } from '#lib/util/util';

export class VoiceStreamStopListener extends Listener<typeof Events.VoiceStreamStop> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.VoiceStreamStop,
		});
	}

	public async run(member: GuildMember, previous: VoiceState) {
		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.findUniqueOrThrow({ where: { id: member.guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(member, previous, data),
			err: async error => this.handleDbErr(error, member, previous),
		});
	}

	private async handleOk(member: GuildMember, previous: VoiceState, { logChannelId }: PrismaGuild) {
		const { guild } = member;
		if (!logChannelId) return this.handleErr(new Error(`Could not fine log channel set for ${member.guild.name}`));

		const channel = guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(member, previous)] });
	}

	private async handleDbErr(error: unknown, member: GuildMember, previous: VoiceState) {
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'))
			return this.handleErr(error);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.create({ data: { id: member.guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(member, previous, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(member: GuildMember, previous: VoiceState) {
		const icon = member.user.displayAvatarURL({ extension: 'png', forceStatic: false });
		return new EmbedBuilder()
			.setAuthor({ name: getTag(member.user), iconURL: icon })
			.setTitle('Member Stopped Streaming')
			.setDescription(`${bold('VC Channel')}: ${previous.channel}`)
			.setFooter({ text: `User ID: ${member.id}` })
			.setColor(Colors.Black)
			.setTimestamp();
	}
}
