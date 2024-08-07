import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { type GuildMember } from 'discord.js';
import { getGuild } from '#lib/database';

export class GuildMemberAddNotifyListener extends Listener<typeof Events.GuildMemberAdd> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildMemberAdd,
		});
	}

	public async run(member: GuildMember) {
		if (member.user.bot) return;

		const result = await Result.fromAsync(async () => getGuild(member.guild.id));

		await result.match({
			ok: async data => this.handleOk(member, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(member: GuildMember, { welcomeChannelId, welcomeMessage }: PrismaGuild) {
		const { guild } = member;
		if (!welcomeChannelId) return;

		const channel = guild.channels.cache.get(welcomeChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Welcome channel is not a text channel'));
		const message = welcomeMessage.replaceAll('{user}', `${member}`).replaceAll('{guild}', guild.name);

		return channel.send(message);
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}
}
