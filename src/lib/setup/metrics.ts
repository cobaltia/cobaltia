import { container } from '@sapphire/framework';
import { AnalyticsRecorder } from '#lib/structures/AnalyticsRecorder';
import { CobaltMetrics } from '#lib/structures/CobaltMetrics';

container.metrics = new CobaltMetrics();
container.analytics = new AnalyticsRecorder();

declare module '@sapphire/framework' {
	interface Container {
		analytics: AnalyticsRecorder;
		metrics: CobaltMetrics;
	}
}
