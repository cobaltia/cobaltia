import { HttpCodes, Route } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';
import { PermissionFlagsBits } from 'discord.js';
import { authenticated, ratelimit } from '#lib/api/utils';

interface SetupRequestBody {
	logChannelId?: string | null;
	voiceChannelId?: string | null;
	welcomeChannelId?: string | null;
	welcomeMessage?: string;
}

export class UserRoute extends Route {
	@authenticated()
	@ratelimit(Time.Second * 5, 2, true)
	public async run(request: Route.Request, response: Route.Response) {
		const params = request.params as Record<string, string>;
		const guildId = params.guild;
		const body = (await request.readBodyJson()) as Partial<SetupRequestBody>;

		if (!guildId || typeof guildId !== 'string') {
			response.status(HttpCodes.BadRequest).json({ error: 'Missing or invalid guild' });
			return;
		}

		if (!body) {
			response.status(HttpCodes.BadRequest).json({ error: 'Missing payload' });
			return;
		}

		const { logChannelId, welcomeChannelId, voiceChannelId, welcomeMessage } = body;

		if (
			(!isNullableString(logChannelId) && logChannelId !== undefined) ||
			(!isNullableString(welcomeChannelId) && welcomeChannelId !== undefined) ||
			(!isNullableString(voiceChannelId) && voiceChannelId !== undefined) ||
			(welcomeMessage !== undefined && typeof welcomeMessage !== 'string')
		) {
			response.status(HttpCodes.BadRequest).json({ error: 'Invalid payload types' });
			return;
		}

		if (
			logChannelId === undefined &&
			welcomeChannelId === undefined &&
			voiceChannelId === undefined &&
			welcomeMessage === undefined
		) {
			response.status(HttpCodes.BadRequest).json({ error: 'No settings provided' });
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

		if (typeof logChannelId === 'string' && !(await this.isGuildChannel(guildId, logChannelId))) {
			response.status(HttpCodes.BadRequest).json({ error: 'Invalid logChannelId' });
			return;
		}

		if (typeof welcomeChannelId === 'string' && !(await this.isGuildChannel(guildId, welcomeChannelId))) {
			response.status(HttpCodes.BadRequest).json({ error: 'Invalid welcomeChannelId' });
			return;
		}

		if (typeof voiceChannelId === 'string' && !(await this.isGuildChannel(guildId, voiceChannelId))) {
			response.status(HttpCodes.BadRequest).json({ error: 'Invalid voiceChannelId' });
			return;
		}

		const updateData: {
			logChannelId?: string | null;
			voiceChannelId?: string | null;
			welcomeChannelId?: string | null;
			welcomeMessage?: string;
		} = {};

		if (logChannelId !== undefined) updateData.logChannelId = logChannelId ?? null;
		if (welcomeChannelId !== undefined) updateData.welcomeChannelId = welcomeChannelId ?? null;
		if (voiceChannelId !== undefined) updateData.voiceChannelId = voiceChannelId ?? null;
		if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage;

		const createData: {
			id: string;
			logChannelId?: string | null;
			voiceChannelId?: string | null;
			welcomeChannelId?: string | null;
			welcomeMessage?: string;
		} = { id: guildId, ...updateData };

		const result = await this.container.prisma.guild.upsert({
			where: { id: guildId },
			update: updateData,
			create: createData,
		});

		response.json({
			logChannelId: result.logChannelId,
			welcomeChannelId: result.welcomeChannelId,
			voiceChannelId: result.voiceChannelId,
			welcomeMessage: result.welcomeMessage,
		});
	}

	private async isGuildChannel(guildId: string, channelId: string) {
		const guild =
			this.container.client.guilds.cache.get(guildId) ?? (await this.container.client.guilds.fetch(guildId));
		if (!guild) return false;
		const channel = await guild.channels.fetch(channelId).catch(() => null);
		return Boolean(channel);
	}
}

function isNullableString(value: unknown): value is string | null | undefined {
	return value === undefined || value === null || typeof value === 'string';
}
