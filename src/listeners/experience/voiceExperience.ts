import type { User as PrismaUser } from '@prisma/client';
import { Listener, Result } from '@sapphire/framework';
import { DurationFormatter, Time } from '@sapphire/time-utilities';
import { isNullish, roundNumber } from '@sapphire/utilities';
import { bold, type GuildMember, type VoiceState } from 'discord.js';
import { getUser } from '#lib/database';
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
		if (isNullish(start))
			return member.send("I must have been restarted while you were in a voice channel. It's so over....");

		const formatter = new DurationFormatter();
		const message = [];
		const end = Date.now();
		const elapsed = end - Number.parseInt(start, 10);
		const time = elapsed / Time.Minute;
		const experience = roundNumber(Math.random() * 11 + time);

		const amount = roundNumber(Math.random() * 11 + 15);
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

		message.push(`You have earned ${bold(formatMoney(total)!)} for spending ${formatter.format(elapsed)} in VC.`);
		await member.send({ content: message.join('\n') });
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}
}
