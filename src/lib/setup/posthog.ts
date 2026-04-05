import { container } from '@sapphire/framework';
import { PostHog } from 'posthog-node';
import { POSTHOG_API_KEY, POSTHOG_HOST } from '#root/config';

const posthog = new PostHog(POSTHOG_API_KEY, {
	host: POSTHOG_HOST,
	enableExceptionAutocapture: true,
});

container.posthog = posthog;

declare module '@sapphire/framework' {
	interface Container {
		posthog: PostHog;
	}
}
