import { container } from '@sapphire/framework';
import { CobaltMetrics } from '#lib/structures/CobaltMetrics';
import { CobaltAnalytics } from '#lib/structures/CobaltAnalytics';

container.metrics = new CobaltMetrics();
container.analytics = new CobaltAnalytics();

declare module '@sapphire/framework' {
	interface Container {
		analytics: CobaltAnalytics;
		metrics: CobaltMetrics;
	}
}
