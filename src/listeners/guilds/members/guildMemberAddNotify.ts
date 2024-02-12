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

	private async handleOk(member: GuildMember, { welcomeChannelId }: PrismaGuild) {
		const { guild } = member;
		if (!welcomeChannelId)
			return this.handleErr(new Error(`Could not fine welcome channel set for ${member.guild.name}`));

		const channel = guild.channels.cache.get(welcomeChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Welcome channel is not a text channel'));

		return channel.send(`Welcome to ${guild.name}, ${member}!\nPlease wait for a staff member to verify you.`);
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}
}
