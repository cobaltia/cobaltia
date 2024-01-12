import { Events, Listener } from '@sapphire/framework';
import { type GuildMember } from 'discord.js';

export class GuildMemberAdd extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildMemberAdd,
		});
	}

	public async run(member: GuildMember) {
		this.container.logger.info(`New member joined: ${member.user.tag}`);
	}
}
