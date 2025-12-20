import { container } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { type Guild } from 'discord.js';

// TODO(Isidro): refactor caching strategy to use redis hashes instead of stringified arrays
export async function fetchMembersFromCache(guild: Guild): Promise<string[]> {
	const { redis } = container;
	const cacheKey = `guild:${guild.id}:members`;

	const cached = await redis.get(cacheKey);

	if (cached) return JSON.parse(cached);

	const members = await guild.members.fetch();
	const membersIds = members.filter(member => !member.user.bot).map(member => member.id);

	await redis.set(cacheKey, JSON.stringify(membersIds), 'EX', Time.Second * 30);

	return membersIds;
}
