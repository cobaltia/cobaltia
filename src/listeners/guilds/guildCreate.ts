import { Events, Listener, Result } from '@sapphire/framework';
import { type Guild } from 'discord.js';
import { getGuild } from '#lib/database';

export class GuildCreate extends Listener<typeof Events.GuildCreate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildCreate,
		});
	}

	public async run(guild: Guild) {
		const result = await Result.fromAsync(async () => getGuild(guild.id));

		await result.match({
			ok: async () => this.handleOk(guild),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(guild: Guild) {
		this.container.logger.info(`Joined guild ${guild.name} (${guild.id})`);
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}
}
