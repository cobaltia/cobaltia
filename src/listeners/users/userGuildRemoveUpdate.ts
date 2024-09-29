import { type User as PrismaUser } from '@prisma/client';
import { Events, Listener, Result } from '@sapphire/framework';
import { type GuildMember } from 'discord.js';
import { getUser } from '#lib/database';

export class UserGuildAddDatabase extends Listener<typeof Events.GuildMemberRemove> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildMemberRemove,
		});
	}

	public async run(member: GuildMember) {
		const result = await Result.fromAsync(async () => getUser(member.user.id));

		await result.match({
			ok: async data => this.handleOk(member, data),
			err: async error => this.container.logger.error(error),
		});
	}

	private async handleOk(member: GuildMember, { guilds }: PrismaUser) {
		await this.container.prisma.user.update({
			where: { id: member.user.id },
			data: { guilds: { set: guilds.filter(guild => guild !== member.guild.id) } },
		});
	}
}
