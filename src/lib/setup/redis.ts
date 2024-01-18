import { container } from '@sapphire/framework';
import Redis from 'ioredis';

container.redis = new Redis();
await container.redis.flushall();

declare module '@sapphire/framework' {
	interface Container {
		redis: Redis;
	}
}
