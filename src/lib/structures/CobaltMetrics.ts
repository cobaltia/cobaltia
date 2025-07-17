/* eslint-disable typescript-sort-keys/interface */
import { container } from '@sapphire/framework';
import { Counter, Gauge, register } from 'prom-client';

interface CobaltCounter {
	command: Counter;
	voiceTime: Counter;
	moneyEarned: Counter;
	moneyLost: Counter;
	money: Gauge;
	message: Counter;
	events: Counter;
	experience: Counter;
	itemBought: Counter;
	itemLost: Counter;
	item: Gauge;
}

export class CobaltMetrics {
	private readonly counters: CobaltCounter;

	public constructor() {
		this.setupGauges();

		this.counters = {
			command: new Counter({
				name: 'cobalt_commands_total',
				help: 'Total number of commands executed',
				registers: [register],
				labelNames: ['command', 'user', 'guild', 'channel', 'success'] as const,
			}),
			voiceTime: new Counter({
				name: 'cobalt_voice_time_total',
				help: 'Total time spent on voice commands',
				registers: [register],
				labelNames: ['user', 'guild', 'channel'] as const,
			}),
			moneyEarned: new Counter({
				name: 'cobalt_money_earned_total',
				help: 'Total amount of money earned',
				registers: [register],
				labelNames: ['command', 'user', 'guild', 'channel'] as const,
			}),
			moneyLost: new Counter({
				name: 'cobalt_money_spent_total',
				help: 'Total amount of money spent',
				registers: [register],
				labelNames: ['command', 'user', 'guild', 'channel'] as const,
			}),
			money: new Gauge({
				name: 'cobalt_money_total',
				help: 'Total amount of money',
				registers: [register],
				labelNames: ['command', 'user', 'guild', 'channel'] as const,
			}),
			message: new Counter({
				name: 'cobalt_messages_total',
				help: 'Total number of messages sent',
				registers: [register],
				labelNames: ['user', 'guild', 'channel'] as const,
			}),
			events: new Counter({
				name: 'cobalt_events_total',
				help: 'Total number of events emitted',
				registers: [register],
				labelNames: ['event', 'guild'] as const,
			}),
			experience: new Counter({
				name: 'cobalt_experience_total',
				help: 'Total amount of experience earned',
				registers: [register],
				labelNames: ['user', 'level_up'] as const,
			}),
			item: new Gauge({
				name: 'cobalt_items_total',
				help: 'Total amount of items',
				registers: [register],
				labelNames: ['item', 'user', 'guild', 'channel'] as const,
			}),
			itemBought: new Counter({
				name: 'cobalt_items_bought_total',
				help: 'Total amount of items bought',
				registers: [register],
				labelNames: ['item', 'user', 'guild', 'channel'] as const,
			}),
			itemLost: new Counter({
				name: 'cobalt_items_lost_total',
				help: 'Total amount of items used/sold',
				registers: [register],
				labelNames: ['item', 'user', 'guild', 'channel', 'type'] as const,
			}),
		};
	}

	public incrementCommand(data: {
		command: string;
		user: string;
		guild: string;
		channel: string;
		success: boolean;
		value?: number;
	}) {
		const { command, user, guild, channel, success, value = 1 } = data;
		this.counters.command.inc(
			{
				command,
				user,
				guild,
				channel,
				success: String(success),
			},
			value,
		);
	}

	public incrementVoiceTime(data: { user: string; guild: string; channel: string; value?: number }) {
		const { user, guild, channel, value = 1 } = data;
		this.counters.voiceTime.inc(
			{
				user,
				guild,
				channel,
			},
			value,
		);
	}

	private incrementMoneyEarned(data: {
		command: string;
		user: string;
		guild: string;
		channel: string;
		value?: number;
	}) {
		const { command, user, guild, channel, value = 1 } = data;
		this.counters.moneyEarned.inc(
			{
				command,
				user,
				guild,
				channel,
			},
			value,
		);
	}

	private incrementMoneyLost(data: { command: string; user: string; guild: string; channel: string; value?: number }) {
		const { command, user, guild, channel, value = 1 } = data;
		this.counters.moneyLost.inc(
			{
				command,
				user,
				guild,
				channel,
			},
			value,
		);
	}

	public updateMoney(data: {
		command: string;
		user: string;
		guild: string;
		channel: string;
		type: 'earn' | 'lose';
		value: number;
	}) {
		const { command, user, guild, channel, type, value } = data;

		if (type === 'lose') {
			this.incrementMoneyLost({ command, user, guild, channel, value });
			this.counters.money.dec({ command, user, guild, channel }, value);
		} else {
			this.incrementMoneyEarned({ command, user, guild, channel, value });
			this.counters.money.inc({ command, user, guild, channel }, value);
		}
	}

	public incrementMessage(data: { user: string; guild: string; channel: string; value?: number }) {
		const { user, guild, channel, value = 1 } = data;
		this.counters.message.inc(
			{
				user,
				guild,
				channel,
			},
			value,
		);
	}

	public incrementEvent(data: { event: string; guild: string; value?: number }) {
		const { event, guild, value = 1 } = data;
		this.counters.events.inc(
			{
				event,
				guild,
			},
			value,
		);
	}

	public incrementExperience(data: { user: string; level_up: boolean; value: number }) {
		const { user, level_up, value } = data;
		this.counters.experience.inc(
			{
				user,
				level_up: String(level_up),
			},
			value,
		);
	}

	public updateItem(data: {
		item: string;
		user: string;
		guild: string;
		channel: string;
		type: 'lost';
		lostType: 'sell' | 'use';
		value?: number;
	}): void;
	public updateItem(data: {
		item: string;
		user: string;
		guild: string;
		channel: string;
		type: 'bought' | 'lost';
		lostType?: 'sell' | 'use';
		value?: number;
	}): void {
		const { item, user, guild, channel, type, lostType, value = 1 } = data;

		if (type === 'lost') {
			this.incrementItemLost({ item, user, guild, channel, type: lostType!, value });
			this.counters.item.dec({ item, user, guild, channel }, value);
		} else if (type === 'bought') {
			this.incrementItemBought({ item, user, guild, channel, value });
			this.counters.item.inc({ item, user, guild, channel }, value);
		}
	}

	private incrementItemLost(data: {
		item: string;
		user: string;
		guild: string;
		channel: string;
		type: 'sell' | 'use';
		value?: number;
	}) {
		const { item, user, guild, channel, type, value = 1 } = data;
		this.counters.itemLost.inc(
			{
				item,
				user,
				guild,
				channel,
				type,
			},
			value,
		);
	}

	private incrementItemBought(data: { item: string; user: string; guild: string; channel: string; value?: number }) {
		const { item, user, guild, channel, value = 1 } = data;
		this.counters.itemBought.inc(
			{
				item,
				user,
				guild,
				channel,
			},
			value,
		);
	}

	private setupGauges() {
		new Gauge({
			name: 'cobalt_guid',
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
