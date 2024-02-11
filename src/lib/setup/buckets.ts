import { container } from '@sapphire/framework';
import type { RateLimitManager } from '@sapphire/ratelimits';

container.experienceBucket = new Map<string, RateLimitManager<string>>();
container.bankBucket = new Map<string, RateLimitManager<string>>();

declare module '@sapphire/framework' {
	interface Container {
		bankBucket: Map<string, RateLimitManager<string>>;
		experienceBucket: Map<string, RateLimitManager<string>>;
	}
}
