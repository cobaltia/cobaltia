import type { User as PrismaUser } from '@prisma/client';
import { Events, Listener, Result } from '@sapphire/framework';
import { roundNumber } from '@sapphire/utilities';
import { type Message } from 'discord.js';
import { getUser } from '#lib/database';
import type { GuildMessage } from '#lib/types';
import { isGuildMessage } from '#util/discord-utilities';
import { handleExperience } from '#util/experience';

export class MessageExperienceListener extends Listener<typeof Events.MessageCreate> {
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
		const experience = roundNumber(Math.random() * 11 + 15);

		const result = await handleExperience(experience, data);

		await result.match({
			ok: async data => {
				if (data === false) return;
				message.channel.send(`Congratulations ${message.author}, you have leveled up to level ${data.level}!`);
			},
			err: async error => this.handleErr(error),
		});
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}
}
