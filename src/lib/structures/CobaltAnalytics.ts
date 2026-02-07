import type { AuditAction, EntityType, ExperienceReason, ItemAction, MoneyReason } from '@prisma/client';
import { container } from '@sapphire/framework';

export class CobaltAnalytics {
	public recordCommand(data: {
		channelId: string;
		command: string;
		guildId: string;
		success: boolean;
		userId: string;
	}) {
		this.write(async () =>
			container.prisma.commandHistory.create({
				data: {
					command: data.command,
					userId: data.userId,
					guildId: data.guildId,
					channelId: data.channelId,
					success: data.success,
				},
			}),
		);
		this.audit({
			action: data.success ? 'COMMAND_SUCCESS' : 'COMMAND_ERROR',
			userId: data.userId,
			guildId: data.guildId,
			channelId: data.channelId,
			targetId: data.command,
			targetType: 'command',
			metadata: `${data.success ? 'Executed' : 'Failed'} ${data.command}`,
		});
		this.resolveEntities(data);
	}

	public recordMoney(data: {
		amount: number;
		channelId: string;
		command: string;
		earned: boolean;
		guildId: string;
		reason: MoneyReason;
		userId: string;
	}) {
		this.write(async () =>
			container.prisma.moneyHistory.create({
				data: {
					userId: data.userId,
					guildId: data.guildId,
					channelId: data.channelId,
					command: data.command,
					reason: data.reason,
					amount: data.amount,
					earned: data.earned,
				},
			}),
		);
		const label = data.earned ? 'Earned' : 'Lost';
		this.audit({
			action: data.earned ? 'MONEY_EARNED' : 'MONEY_LOST',
			userId: data.userId,
			guildId: data.guildId,
			channelId: data.channelId,
			targetId: data.reason,
			targetType: 'economy',
			metadata: `${label} $${data.amount} from ${data.reason.toLowerCase()}`,
		});
		this.resolveEntities(data);
	}

	public recordExperience(data: { amount: number; levelUp: boolean; reason: ExperienceReason; userId: string }) {
		this.write(async () =>
			container.prisma.experienceHistory.create({
				data: {
					userId: data.userId,
					reason: data.reason,
					amount: data.amount,
					levelUp: data.levelUp,
				},
			}),
		);
		this.audit({
			action: data.levelUp ? 'LEVEL_UP' : 'EXPERIENCE_GAINED',
			userId: data.userId,
			targetId: data.reason,
			targetType: 'experience',
			metadata: data.levelUp
				? `Leveled up from ${data.reason.toLowerCase()}`
				: `Gained ${data.amount} XP from ${data.reason.toLowerCase()}`,
		});
		this.resolveEntities(data);
	}

	public recordMessage(data: { channelId: string; guildId: string; userId: string }) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		this.write(async () =>
			container.prisma.messageHistory.upsert({
				where: {
					userId_guildId_channelId_date: {
						userId: data.userId,
						guildId: data.guildId,
						channelId: data.channelId,
						date: today,
					},
				},
				create: {
					userId: data.userId,
					guildId: data.guildId,
					channelId: data.channelId,
					date: today,
					count: 1,
				},
				update: {
					count: { increment: 1 },
				},
			}),
		);
		this.resolveEntities(data);
	}

	public recordItem(data: {
		action: ItemAction;
		channelId: string;
		guildId: string;
		itemId: string;
		quantity: number;
		userId: string;
	}) {
		this.write(async () =>
			container.prisma.itemHistory.create({
				data: {
					userId: data.userId,
					guildId: data.guildId,
					channelId: data.channelId,
					itemId: data.itemId,
					action: data.action,
					quantity: data.quantity,
				},
			}),
		);
		const auditActionMap = { BUY: 'ITEM_BOUGHT', SELL: 'ITEM_SOLD', USE: 'ITEM_USED' } as const;
		const labelMap = { BUY: 'Bought', SELL: 'Sold', USE: 'Used' } as const;
		this.audit({
			action: auditActionMap[data.action],
			userId: data.userId,
			guildId: data.guildId,
			channelId: data.channelId,
			targetId: data.itemId,
			targetType: 'item',
			metadata: `${labelMap[data.action]} ${data.quantity}x ${data.itemId}`,
		});
		this.resolveEntities(data);
	}

	public audit(data: {
		action: AuditAction;
		channelId?: string;
		guildId?: string;
		metadata?: string;
		targetId?: string;
		targetType?: string;
		userId: string;
	}): void {
		const payload = {
			action: data.action,
			userId: data.userId,
			guildId: data.guildId === 'none' ? null : (data.guildId ?? null),
			channelId: data.channelId === 'none' ? null : (data.channelId ?? null),
			targetId: data.targetId ?? null,
			targetType: data.targetType ?? null,
			metadata: data.metadata ?? null,
			createdAt: new Date().toISOString(),
		};

		this.write(async () => container.prisma.auditLog.create({ data: payload }));

		container.redis
			.publish('audit:events', JSON.stringify(payload))
			// eslint-disable-next-line promise/prefer-await-to-then, promise/prefer-await-to-callbacks
			.catch(error => container.logger.error('[AnalyticsRecorder] Redis publish failed', error));
	}

	private resolveEntities(ids: { channelId?: string; guildId?: string; userId?: string }): void {
		const { client } = container;
		if (!client.isReady()) return;

		const entities: { id: string; name: string; type: EntityType }[] = [];

		if (ids.userId && ids.userId !== 'none') {
			const user = client.users.cache.get(ids.userId);
			if (user) entities.push({ id: user.id, type: 'USER', name: user.username });
		}

		if (ids.guildId && ids.guildId !== 'none') {
			const guild = client.guilds.cache.get(ids.guildId);
			if (guild) entities.push({ id: guild.id, type: 'GUILD', name: guild.name });
		}

		if (ids.channelId && ids.channelId !== 'none') {
			const channel = client.channels.cache.get(ids.channelId);
			if (channel && 'name' in channel && channel.name) {
				entities.push({ id: channel.id, type: 'CHANNEL', name: channel.name });
			}
		}

		for (const entity of entities) {
			this.write(async () =>
				container.prisma.discordEntity.upsert({
					where: { id: entity.id },
					create: entity,
					update: { name: entity.name },
				}),
			);
		}
	}

	private write(fn: () => Promise<unknown>): void {
		// eslint-disable-next-line promise/prefer-await-to-then, promise/prefer-await-to-callbacks
		fn().catch(error => container.logger.error('[AnalyticsRecorder]', error));
	}
}
