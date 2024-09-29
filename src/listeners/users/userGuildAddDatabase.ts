import { Events, Listener } from '@sapphire/framework';
import { type GuildMember } from 'discord.js';

export class UserGuildAddDatabase extends Listener<typeof Events.GuildMemberAdd> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildMemberAdd,
		});
	}

	public async run(member: GuildMember) {
		await this.container.prisma.user.upsert({
			where: { id: member.user.id },
			create: { id: member.user.id, guilds: [member.guild.id] },
			update: { id: member.user.id, guilds: { push: member.guild.id } },
		});
	}
}
