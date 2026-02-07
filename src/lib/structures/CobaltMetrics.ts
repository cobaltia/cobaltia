import { container } from '@sapphire/framework';
import { Counter, Gauge, register } from 'prom-client';

export class CobaltMetrics {
	private readonly events: Counter;

	public constructor() {
		this.setupGauges();

		this.events = new Counter({
			name: 'cobalt_events_total',
			help: 'Total number of events emitted',
			registers: [register],
			labelNames: ['event'] as const,
		});
	}

	public incrementEvent(data: { event: string; value?: number }) {
		const { event, value = 1 } = data;
		this.events.inc({ event }, value);
	}

	private setupGauges() {
		new Gauge({
			name: 'cobalt_guild_total',
			help: 'Total number of guilds',
			registers: [register],
			collect() {
				if (container.client.isReady()) {
					this.set(container.client.guilds.cache.size);
				}
			},
		});

		new Gauge({
			name: 'cobalt_user_total',
			help: 'Total number of users',
			registers: [register],
			collect() {
				if (container.client.isReady()) {
					this.set(container.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0));
				}
			},
		});
	}
}
