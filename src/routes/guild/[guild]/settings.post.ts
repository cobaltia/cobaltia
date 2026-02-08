import type { Guild } from '@prisma/client';
import { HttpCodes, Route } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';
import { PermissionFlagsBits } from 'discord.js';
import { authenticated, ratelimit } from '#lib/api/utils';

const DEFAULT_WELCOME_MESSAGE = 'Welcome to {guild}, {user}!';
const CHANNEL_FIELDS = ['logChannelId', 'welcomeChannelId', 'voiceChannelId'] as const;

type ChannelField = (typeof CHANNEL_FIELDS)[number];

interface SetupRequestBody {
	logChannelId?: string | null;
	voiceChannelId?: string | null;
	welcomeChannelId?: string | null;
	welcomeMessage?: string;
}

type UpdateData = Partial<Pick<SetupRequestBody, ChannelField | 'welcomeMessage'>>;

export class UserRoute extends Route {
	@authenticated()
	@ratelimit(Time.Second * 5, 2, true)
	public async run(request: Route.Request, response: Route.Response) {
		const guildId = (request.params as Record<string, string>).guild;

		if (!guildId || typeof guildId !== 'string') {
			response.status(HttpCodes.BadRequest).json({ error: 'Missing or invalid guild' });
			return;
		}

		const body = await this.parseBody(request, response);
		if (!body) return;

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

		const invalidChannel = await this.findInvalidChannel(guildId, body);
		if (invalidChannel) {
			response.status(HttpCodes.BadRequest).json({ error: `Invalid ${invalidChannel}` });
			return;
		}

		const updateData = this.buildUpdateData(body);
		const previous = await this.container.prisma.guild.findUnique({ where: { id: guildId } });
		const { actualUpdates, changes } = this.computeChanges(previous, updateData);

		const result = await this.container.prisma.guild.upsert({
			where: { id: guildId },
			update: actualUpdates,
			create: { id: guildId, ...updateData },
		});

		if (changes.length > 0) {
			this.container.analytics.audit({
				action: 'GUILD_SETTING_UPDATED',
				userId: request.auth!.id,
				guildId,
				metadata: changes.join(', ').slice(0, 255),
			});
		}

		response.json({
			logChannelId: result.logChannelId,
			welcomeChannelId: result.welcomeChannelId,
			voiceChannelId: result.voiceChannelId,
			welcomeMessage: result.welcomeMessage,
		});
	}

	private async parseBody(request: Route.Request, response: Route.Response): Promise<SetupRequestBody | null> {
		const body = (await request.readBodyJson()) as Partial<SetupRequestBody>;

		if (!body) {
			response.status(HttpCodes.BadRequest).json({ error: 'Missing payload' });
			return null;
		}

		for (const field of CHANNEL_FIELDS) {
			if (body[field] !== undefined && !isNullableString(body[field])) {
				response.status(HttpCodes.BadRequest).json({ error: 'Invalid payload types' });
				return null;
			}
		}

		if (
			body.welcomeMessage !== undefined &&
			body.welcomeMessage !== null &&
			typeof body.welcomeMessage !== 'string'
		) {
			response.status(HttpCodes.BadRequest).json({ error: 'Invalid payload types' });
			return null;
		}

		const normalizedWelcomeMessage =
			body.welcomeMessage === null ||
			(typeof body.welcomeMessage === 'string' && body.welcomeMessage.trim() === '')
				? DEFAULT_WELCOME_MESSAGE
				: body.welcomeMessage;

		if (CHANNEL_FIELDS.every(field => body[field] === undefined) && normalizedWelcomeMessage === undefined) {
			response.status(HttpCodes.BadRequest).json({ error: 'No settings provided' });
			return null;
		}

		return { ...body, welcomeMessage: normalizedWelcomeMessage };
	}

	private async findInvalidChannel(guildId: string, body: SetupRequestBody): Promise<ChannelField | null> {
		for (const field of CHANNEL_FIELDS) {
			const value = body[field];
			if (typeof value === 'string' && !(await this.isGuildChannel(guildId, value))) {
				return field;
			}
		}

		return null;
	}

	private buildUpdateData(body: SetupRequestBody): UpdateData {
		const data: UpdateData = {};

		for (const field of CHANNEL_FIELDS) {
			if (body[field] !== undefined) {
				data[field] = body[field] ?? null;
			}
		}

		if (body.welcomeMessage !== undefined) {
			data.welcomeMessage = body.welcomeMessage;
		}

		return data;
	}

	private computeChanges(previous: Guild | null, updateData: UpdateData) {
		const actualUpdates: UpdateData = {};
		const changes: string[] = [];

		for (const key of Object.keys(updateData) as (keyof UpdateData)[]) {
			const before = previous?.[key] ?? null;
			const after = updateData[key] ?? null;
			if (before !== after) {
				actualUpdates[key] = updateData[key] as never;
				changes.push(`${key}: ${before ?? 'none'} → ${after ?? 'none'}`);
			}
		}

		return { actualUpdates, changes };
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
