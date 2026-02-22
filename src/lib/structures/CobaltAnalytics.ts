import type { AuditAction, EntityType, ExperienceReason, ItemAction, MoneyReason, MoneyType } from '@prisma/client';
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
		this.resolveEntities(data);
	}

	public recordMoney(data: {
		amount: number;
		channelId: string;
		command: string;
		description?: string;
		guildId: string;
		reason: MoneyReason;
		type: MoneyType;
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
					type: data.type,
					description: data.description ?? null,
				},
			}),
		);
		this.resolveEntities(data);
	}

	public recordExperience(data: {
		amount: number;
		channelId: string;
		guildId: string;
		levelUp: boolean;
		reason: ExperienceReason;
		userId: string;
	}) {
		this.write(async () =>
			container.prisma.experienceHistory.create({
				data: {
					userId: data.userId,
					guildId: data.guildId,
					channelId: data.channelId,
					reason: data.reason,
					amount: data.amount,
					levelUp: data.levelUp,
				},
			}),
		);
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
		this.resolveEntities(data);
	}

	public audit(data: {
		action: AuditAction;
		guildId: string;
		metadata?: string;
		targetId?: string;
		targetType?: string;
		userId: string;
	}): void {
		const payload = {
			action: data.action,
			userId: data.userId,
			guildId: data.guildId,
			targetId: data.targetId ?? null,
			targetType: data.targetType ?? null,
			metadata: data.metadata ?? null,
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
