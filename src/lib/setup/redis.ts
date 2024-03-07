import { container } from '@sapphire/framework';
import Redis from 'ioredis';
import { REDIS_URI } from '#root/config';

container.redis = new Redis(REDIS_URI);

declare module '@sapphire/framework' {
	interface Container {
		redis: Redis;
	}
}
