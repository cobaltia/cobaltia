import type { User as PrismaUser } from '@prisma/client';
import { Events, Listener, Result } from '@sapphire/framework';
import { type RateLimit, RateLimitManager } from '@sapphire/ratelimits';
import { Time } from '@sapphire/time-utilities';
import { roundNumber } from '@sapphire/utilities';
import type { Message } from 'discord.js';
import { getUser } from '#lib/database';
import type { GuildMessage } from '#lib/types';
import { addBonus } from '#util/common';
import { calculateBonus, isGuildMessage } from '#util/discord-utilities';

export class AddBankSpaceListener extends Listener<typeof Events.MessageCreate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessageCreate,
		});
	}

	public async run(message: Message) {
		if (message.author.bot || !isGuildMessage(message) || message.system || message.webhookId !== null) return;

		const ratelimit = this.getManager(message.author.id).acquire(message.author.id);

		if (ratelimit.limited) return;

		const result = await Result.fromAsync(async () => getUser(message.author.id));

		await result.match({
			ok: async data => this.handleOk(message, data, ratelimit),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(message: GuildMessage, data: PrismaUser, ratelimit: RateLimit<string>) {
		const space = roundNumber(Math.random() * 11 + 15);
		const bonus = await calculateBonus(message.author, message.guild);
		const total = addBonus(space, bonus);

		await this.container.prisma.user.update({
			where: { id: message.author.id },
			data: { bankLimit: data.bankLimit.add(total) },
		});

		ratelimit.consume();
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private getManager(id: string) {
		const manager = this.container.experienceBucket.get(id);
		if (manager) return manager;

		const newManager = new RateLimitManager(Time.Minute);
		this.container.bankBucket.set(id, newManager);
		return newManager;
	}
}
