import { Prisma } from '@prisma/client';
import { Events, Listener, Result } from '@sapphire/framework';
import { type Guild } from 'discord.js';

export class GuildCreate extends Listener<typeof Events.GuildCreate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildCreate,
		});
	}

	public async run(guild: Guild) {
		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.findUniqueOrThrow({ where: { id: guild.id } }),
		);

		await result.match({
			ok: async () => this.handleOk(guild),
			err: async error => this.handleDbErr(error, guild),
		});
	}

	private async handleOk(guild: Guild) {
		this.container.logger.info(`Joined guild ${guild.name} (${guild.id})`);
	}

	private async handleDbErr(error: unknown, guild: Guild) {
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'))
			return this.handleErr(error);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.create({ data: { id: guild.id } }),
		);

		await result.match({
			ok: async () => this.handleOk(guild),
			err: async error => this.handleErr(error),
		});
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}
}
