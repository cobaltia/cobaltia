/* eslint-disable typescript-sort-keys/interface */
import { Decimal } from '@prisma/client/runtime/library';
import { getTotalMoneyUsers } from '@prisma/client/sql';
import { container } from '@sapphire/framework';
import { Counter, Gauge, register } from 'prom-client';

interface CobaltCounter {
	command: Counter;
	voiceTime: Counter;
	moneyEarned: Counter;
	moneyLost: Counter;
	message: Counter;
	events: Counter;
	experience: Counter;
	itemBought: Counter;
	itemLost: Counter;
}

type MoneyReason = 'bounty_claim' | 'daily' | 'death' | 'gambling' | 'rob' | 'store' | 'tax' | 'voice' | 'work';
type ExperienceReason = 'message' | 'voice';
type ItemReason = 'sell' | 'use';

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
				labelNames: ['command', 'user', 'guild', 'channel', 'reason'] as const,
			}),
			moneyLost: new Counter({
				name: 'cobalt_money_spent_total',
				help: 'Total amount of money spent',
				registers: [register],
				labelNames: ['command', 'user', 'guild', 'channel', 'reason'] as const,
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
				labelNames: ['event'] as const,
			}),
			experience: new Counter({
				name: 'cobalt_experience_total',
				help: 'Total amount of experience earned',
				registers: [register],
				labelNames: ['user', 'level_up', 'reason'] as const,
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
				labelNames: ['item', 'user', 'guild', 'channel', 'reason'] as const,
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

	public incrementMoneyEarned(data: {
		command: string;
		user: string;
		guild: string;
		channel: string;
		reason: MoneyReason;
		value?: number;
	}) {
		const { command, user, guild, channel, reason, value = 1 } = data;
		this.counters.moneyEarned.inc(
			{
				command,
				user,
				guild,
				channel,
				reason,
			},
			value,
		);
	}

	public incrementMoneyLost(data: {
		command: string;
		user: string;
		guild: string;
		channel: string;
		reason: MoneyReason;
		value?: number;
	}) {
		const { command, user, guild, channel, reason, value = 1 } = data;
		this.counters.moneyLost.inc(
			{
				command,
				user,
				guild,
				channel,
				reason,
			},
			value,
		);
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

	public incrementEvent(data: { event: string; value?: number }) {
		const { event, value = 1 } = data;
		this.counters.events.inc(
			{
				event,
			},
			value,
		);
	}

	public incrementExperience(data: { user: string; level_up: boolean; reason: ExperienceReason; value: number }) {
		const { user, level_up, reason, value } = data;
		this.counters.experience.inc(
			{
				user,
				level_up: String(level_up),
				reason,
			},
			value,
		);
	}

	public incrementItemLost(data: {
		item: string;
		user: string;
		guild: string;
		channel: string;
		reason: ItemReason;
		value?: number;
	}) {
		const { item, user, guild, channel, reason, value = 1 } = data;
		this.counters.itemLost.inc(
			{
				item,
				user,
				guild,
				channel,
				reason,
			},
			value,
		);
	}

	public incrementItemBought(data: { item: string; user: string; guild: string; channel: string; value?: number }) {
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

		new Gauge({
			name: 'cobalt_money_total',
			help: 'Total amount of money',
			registers: [register],
			async collect() {
				const result = await container.prisma.$queryRawTyped(getTotalMoneyUsers());
				const clientResult = await container.prisma.client.findUnique({
					where: {
						id: container.client.user!.id,
					},
				});

				const totalMoney = result[0].total_money ? new Decimal(result[0].total_money) : new Decimal(0);
				const clientMoney = clientResult?.bankBalance ?? new Decimal(0);
				const total = totalMoney.add(clientMoney);
				this.set(total.toNumber());
			},
		});

		new Gauge({
			name: 'cobalt_items_total',
			help: 'Total amount of items',
			registers: [register],
			labelNames: ['item'] as const,
			async collect() {
				const items = container.stores.get('items');
				for (const [_, item] of items) {
					const result = await container.prisma.inventory.aggregate({
						where: {
							itemId: item.name,
						},
						_sum: {
							quantity: true,
						},
					});
					this.set({ item: item.name }, Number(result._sum?.quantity) ?? 0);
				}
			},
		});
	}
}
