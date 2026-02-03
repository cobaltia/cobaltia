import { createFunctionPrecondition } from '@sapphire/decorators';
import { container } from '@sapphire/framework';
import { type ApiRequest, type ApiResponse, HttpCodes, type LoginData } from '@sapphire/plugin-api';
import { RateLimitManager } from '@sapphire/ratelimits';
import {
	type Guild,
	GuildDefaultMessageNotifications,
	GuildExplicitContentFilter,
	type GuildMember,
	GuildMFALevel,
	GuildPremiumTier,
	GuildVerificationLevel,
	Locale,
	PermissionFlagsBits,
	type RESTAPIPartialCurrentUserGuild,
	type Client,
} from 'discord.js';
import { flattenGuild } from '#lib/api/ApiTransformers';
import type { OauthFlattenedGuild, PartialOauthFlattenedGuild, TransformedLoginData } from '#lib/api/types';
import { PermissionsBits } from '#lib/util/bits';

export const authenticated = () =>
	createFunctionPrecondition(
		(request: ApiRequest) => Boolean(request.auth?.token),
		(_request: ApiRequest, response: ApiResponse) => response.error(HttpCodes.Unauthorized),
	);

/**
 * @param time - The amount of milliseconds for the ratelimits from this manager to expire.
 * @param limit - The amount of times a RateLimit can drip before it's limited.
 * @param auth - Whether or not this should be auth-limited
 */
export function ratelimit(time: number, limit = 1, auth = false) {
	const manager = new RateLimitManager(time, limit);
	const xRateLimitLimit = time;
	return createFunctionPrecondition(
		(request: ApiRequest, response: ApiResponse) => {
			const id = (
				auth ? request.auth!.id : (request.headers['x-forwarded-for'] ?? request.socket.remoteAddress)
			) as string;
			const bucket = manager.acquire(id);

			response.setHeader('Date', new Date().toUTCString());
			if (bucket.limited) {
				response.setHeader('Retry-After', bucket.remainingTime.toString());
				return false;
			}

			try {
				bucket.consume();
			} catch {}

			response.setHeader('X-RateLimit-Limit', xRateLimitLimit);
			response.setHeader('X-RateLimit-Remaining', bucket.remaining.toString());
			response.setHeader('X-RateLimit-Reset', bucket.remainingTime.toString());

			return true;
		},
		(_request: ApiRequest, response: ApiResponse) => {
			response.error(HttpCodes.TooManyRequests);
		},
	);
}

function isAdmin(member: GuildMember) {
	return member.permissions.has(PermissionFlagsBits.ManageGuild);
}

export function canManage(guild: Guild, member: GuildMember) {
	if (guild.ownerId === member.id) return true;

	return isAdmin(member);
}

export async function getManageable(id: string, oauthGuild: RESTAPIPartialCurrentUserGuild, guild: Guild | undefined) {
	if (oauthGuild.owner) return true;
	if (typeof guild === 'undefined')
		return PermissionsBits.has(BigInt(oauthGuild.permissions), PermissionFlagsBits.ManageGuild);

	const member = await guild.members.fetch(id).catch(() => null);
	if (!member) return false;

	return canManage(guild, member);
}

async function transformGuild(
	client: Client,
	userId: string,
	data: RESTAPIPartialCurrentUserGuild,
): Promise<OauthFlattenedGuild> {
	const guild = client.guilds.cache.get(data.id);

	const serialized: PartialOauthFlattenedGuild =
		typeof guild === 'undefined'
			? {
					afkChannelId: null,
					afkTimeout: 0,
					applicationId: null,
					approximateMemberCount: null,
					approximatePresenceCount: null,
					available: true,
					banner: null,
					channels: [],
					defaultMessageNotifications: GuildDefaultMessageNotifications.OnlyMentions,
					description: null,
					widgetEnabled: false,
					explicitContentFilter: GuildExplicitContentFilter.Disabled,
					icon: data.icon,
					id: data.id,
					joinedTimestamp: null,
					mfaLevel: GuildMFALevel.None,
					name: data.name,
					ownerId: data.owner ? userId : null,
					partnered: false,
					preferredLocale: Locale.EnglishUS,
					premiumSubscriptionCount: null,
					premiumTier: GuildPremiumTier.None,
					roles: [],
					splash: null,
					systemChannelId: null,
					vanityURLCode: null,
					verificationLevel: GuildVerificationLevel.None,
					verified: false,
				}
			: flattenGuild(guild);

	return {
		...serialized,
		permissions: data.permissions,
		manageable: await getManageable(userId, data, guild),
		cobaltiaIsIn: typeof guild !== 'undefined',
	};
}

export async function transformOauthGuildsAndUser({ user, guilds }: LoginData): Promise<TransformedLoginData> {
	if (!user || !guilds) return { user, guilds };

	const { client } = container;
	const userId = user.id;

	const transformedGuilds = await Promise.all(guilds.map(async guild => transformGuild(client, userId, guild)));
	return { user, transformedGuilds };
}
