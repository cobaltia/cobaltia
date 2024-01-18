import { Prisma, type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Listener, Result } from '@sapphire/framework';
import { DurationFormatter } from '@sapphire/time-utilities';
import { EmbedBuilder, bold, type GuildMember, type VoiceState } from 'discord.js';
import { Events } from '#lib/types';
import { Colors } from '#lib/util/constants';
import { getTag } from '#lib/util/util';

export class VoiceChannelLeaveListener extends Listener<typeof Events.VoiceChannelLeave> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, { ...options, event: Events.VoiceChannelLeave });
	}

	public async run(member: GuildMember, previous: VoiceState, start: string | null) {
		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.findUniqueOrThrow({ where: { id: member.guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(member, previous, start, data),
			err: async error => this.handleDbErr(error, member, previous, start),
		});
	}

	private async handleOk(
		member: GuildMember,
		previous: VoiceState,
		start: string | null,
		{ logChannelId }: PrismaGuild,
	) {
		const { guild } = member;
		if (!logChannelId) return this.handleErr(new Error(`Could not fine log channel set for ${member.guild.name}`));

		const channel = guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		const end = Date.now();
		let elapsed: number | null = null;
		if (start) elapsed = end - Number.parseInt(start, 10);

		return channel.send({ embeds: [this.buildEmbed(member, previous, elapsed)] });
	}

	private async handleDbErr(error: unknown, member: GuildMember, previous: VoiceState, start: string | null) {
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'))
			return this.handleErr(error);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.create({ data: { id: member.guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(member, previous, start, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(member: GuildMember, previous: VoiceState, elapsed: number | null) {
		const icon = member.user.displayAvatarURL({ extension: 'png', forceStatic: false });
		return new EmbedBuilder()
			.setAuthor({ name: getTag(member.user), iconURL: icon })
			.setTitle('Member Left VC')
			.setDescription(this.buildDescription(previous, elapsed))
			.setFooter({ text: `User ID: ${member.id}` })
			.setColor(Colors.Green)
			.setTimestamp();
	}

	private buildDescription(previous: VoiceState, elapsed: number | null) {
		const formatter = new DurationFormatter();
		const description = [`${bold('VC Channel')}: ${previous.channel}`];
		if (elapsed) description.push(`${bold('Time Elapsed')}: ${formatter.format(elapsed)}`);
		return description.join('\n');
	}
}
