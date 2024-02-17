import type { User as PrismaUser } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Listener, Result } from '@sapphire/framework';
import { DurationFormatter, Time } from '@sapphire/time-utilities';
import { isNullish, roundNumber } from '@sapphire/utilities';
import { bold, type GuildMember, type VoiceState } from 'discord.js';
import { getGuild, getUser } from '#lib/database';
import { Events } from '#lib/types';
import { addBonus, formatMoney } from '#util/common';
import { calculateBonus } from '#util/discord-utilities';
import { handleExperience } from '#util/experience';

export class VoiceExperienceListener extends Listener<typeof Events.VoiceChannelLeave> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.VoiceChannelLeave,
		});
	}

	public async run(member: GuildMember, previous: VoiceState, start: string | null) {
		const result = await Result.fromAsync(async () => getUser(member.id));

		await result.match({
			ok: async data => this.handleOk(member, previous, start, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(member: GuildMember, previous: VoiceState, start: string | null, data: PrismaUser) {
		const { guild } = member;
		const guildResult = await Result.fromAsync(async () => getGuild(member.guild.id));
		if (guildResult.isErr()) throw guildResult.unwrapErr();
		const { voiceChannelId } = guildResult.unwrap();
		console.log(voiceChannelId);
		if (!voiceChannelId) return;
		const channel = guild.channels.cache.get(voiceChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Voice channel is not a text channel'));

		if (isNullish(start))
			return channel.send(
				`${member}, I must have been restarted while you were in a voice channel. It's so over....`,
			);

		const formatter = new DurationFormatter();
		const message = [];
		const end = Date.now();
		const elapsed = end - Number.parseInt(start, 10);
		const time = elapsed / Time.Minute;
		const experience = roundNumber(Math.random() * 11 + time);

		const amount = roundNumber(Math.random() * 11 + time);
		const bonus = await calculateBonus(member.user, member.guild);
		const total = addBonus(amount, bonus);

		const result = await handleExperience(experience, data);

		await result.match({
			ok: async data => {
				if (data === false) return;
				message.push(`Congratulations ${member}, you have leveled up to level ${data.level}!`);
			},
			err: async error => this.handleErr(error),
		});

		await this.container.prisma.user.update({
			where: { id: data.id },
			data: {
				wallet: data.wallet + total,
				Voice: {
					create: {
						channelId: previous.channelId!,
						guildId: previous.guild.id,
						date: new Date(),
						duration: elapsed,
					},
				},
			},
		});

		message.push(
			`${member}, You have earned ${bold(formatMoney(total)!)} for spending ${formatter.format(elapsed)} in VC.`,
		);
		await channel.send({ content: message.join('\n') });
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}
}
