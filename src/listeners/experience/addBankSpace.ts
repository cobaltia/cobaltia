import type { User as PrismaUser } from '@prisma/client';
import { Events, Listener, Result } from '@sapphire/framework';
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

		const result = await Result.fromAsync(async () => getUser(message.author.id));

		await result.match({
			ok: async data => this.handleOk(message, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(message: GuildMessage, data: PrismaUser) {
		const space = roundNumber(Math.random() * 11 + 15);
		const bonus = await calculateBonus(message.author, message.guild);
		const total = addBonus(space, bonus);

		await this.container.prisma.user.update({
			where: { id: message.author.id },
			data: { bankLimit: data.bankLimit + total },
		});
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}
}
