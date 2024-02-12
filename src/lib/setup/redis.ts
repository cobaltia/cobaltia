import { container } from '@sapphire/framework';
import Redis from 'ioredis';
import { REDIS_URI } from '#root/config';

container.redis = new Redis(REDIS_URI);
// TODO(*): Figure out how to flush the Redis database when the program exits.
await container.redis.flushall();

declare module '@sapphire/framework' {
	interface Container {
		redis: Redis;
	}
}
