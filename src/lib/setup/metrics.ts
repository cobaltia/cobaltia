import { container } from '@sapphire/framework';
import { CobaltMetrics } from '#lib/structures/CobaltMetrics';

container.metrics = new CobaltMetrics();

declare module '@sapphire/framework' {
	interface Container {
		metrics: CobaltMetrics;
	}
}
