import { HttpCodes, Route } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';
import { PermissionFlagsBits } from 'discord.js';
import { authenticated, ratelimit } from '#lib/api/utils';

const DEFAULT_WELCOME_MESSAGE = 'Welcome to {guild}, {user}!';

export class UserRoute extends Route {
	@authenticated()
	@ratelimit(Time.Second * 5, 2, true)
	public async run(request: Route.Request, response: Route.Response) {
		const params = request.params as Record<string, string>;
		const guildId = params.guild;

		if (!guildId || typeof guildId !== 'string') {
			response.status(HttpCodes.BadRequest).json({ error: 'Missing or invalid guild' });
			return;
		}

		const guild = await this.container.client.guilds.fetch(guildId).catch(() => null);
		if (!guild) {
			response.status(HttpCodes.NotFound).json({ error: 'Guild not found' });
			return;
		}

		const member = await guild.members.fetch(request.auth!.id).catch(() => null);
		if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
			response.status(HttpCodes.Forbidden).json({ error: 'Missing ManageGuild permission' });
			return;
		}

		const result = await this.container.prisma.guild.findUnique({ where: { id: guildId } });

		response.json({
			logChannelId: result?.logChannelId ?? null,
			welcomeChannelId: result?.welcomeChannelId ?? null,
			voiceChannelId: result?.voiceChannelId ?? null,
			welcomeMessage: result?.welcomeMessage ?? DEFAULT_WELCOME_MESSAGE,
		});
	}
}
