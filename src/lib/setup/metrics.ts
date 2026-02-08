import { container } from '@sapphire/framework';
import { CobaltAnalytics } from '#lib/structures/CobaltAnalytics';
import { CobaltMetrics } from '#lib/structures/CobaltMetrics';

container.metrics = new CobaltMetrics();
container.analytics = new CobaltAnalytics();

declare module '@sapphire/framework' {
	interface Container {
		analytics: CobaltAnalytics;
		metrics: CobaltMetrics;
	}
}
