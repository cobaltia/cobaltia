import { setTimeout as sleep } from 'node:timers/promises';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { Stopwatch } from '@sapphire/stopwatch';
import { EmbedBuilder, RESTJSONErrorCodes, Status, type RESTError, type User } from 'discord.js';

const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 1_000;
const USERNAME_PREFIX_DELETED = 'deleted_user_';

interface FetchUserResult {
	treatAsDeleted: boolean;
	user: User | null;
}

export class CleanDeletedUsersTask extends ScheduledTask {
	public constructor(context: ScheduledTask.LoaderContext, options: ScheduledTask.Options) {
		super(context, {
			...options,
			pattern: '0 0 * * 0', // Runs every Sunday at midnight
		});
	}

	public async run() {
		if (this.container.client.ws.status !== Status.Ready) return;
		const stopwatch = new Stopwatch();

		const users = await this.container.prisma.user.findMany({
			select: { id: true },
		});

		const userIds = users.map(user => user.id);
		const deletedUserIds: string[] = [];

		for (let index = 0; index < userIds.length; index += BATCH_SIZE) {
			const batch = userIds.slice(index, index + BATCH_SIZE);

			const batchResults = await Promise.all(
				batch.map(async userId => {
					const cachedUser = this.container.client.users.cache.get(userId);
					if (cachedUser) {
						return { userId, user: cachedUser, treatAsDeleted: false };
					}

					return { userId, ...(await this.fetchUser(userId)) };
				}),
			);

			for (const { user, userId, treatAsDeleted } of batchResults) {
				if (user && !this.isLikelyDeletedUser(user.username)) continue;
				if (!user && !treatAsDeleted) continue;

				deletedUserIds.push(userId);
			}

			if (index + BATCH_SIZE < userIds.length) {
				await sleep(BATCH_DELAY_MS);
			}
		}

		if (deletedUserIds.length === 0) return;

		try {
			const { count } = await this.container.prisma.user.deleteMany({
				where: {
					id: { in: deletedUserIds },
				},
			});

			const { duration } = stopwatch.stop();
			const runTime = this.getDuration(duration);

			this.container.logger.info(
				`[CleanDeletedUsersTask] Removed ${count} orphaned user record${count === 1 ? '' : 's'}. (${runTime})`,
			);
			if (this.container.webhookLog) {
				const embed = new EmbedBuilder()
					.setTitle('Cleaned Deleted Users')
					.setDescription(`Removed **${count}** orphaned user record${count === 1 ? '' : 's'}.`)
					.setFooter({ text: `Time Elapsed - ${runTime}` });
				await this.container.webhookLog.send({ embeds: [embed] });
			}
		} catch (error: unknown) {
			this.container.logger.error('[CleanDeletedUsersTask] Failed to delete orphaned users', error);
			if (this.container.webhookLog) {
				const embed = new EmbedBuilder()
					.setTitle('Cleaned Deleted Users')
					.setDescription(`Failed to delete orphaned users.`);
				await this.container.webhookLog.send({ embeds: [embed] });
			}
		}
	}

	private async fetchUser(userId: string): Promise<FetchUserResult> {
		try {
			const user = await this.container.client.users.fetch(userId);
			return { user, treatAsDeleted: false };
		} catch (error: unknown) {
			if (this.isUnknownUserError(error)) {
				return { user: null, treatAsDeleted: true };
			}

			this.container.logger.warn(`[CleanDeletedUsersTask] Failed to fetch user ${userId}`, error);
			return { user: null, treatAsDeleted: false };
		}
	}

	private isUnknownUserError(error: unknown): error is RESTError {
		return (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			error.code === RESTJSONErrorCodes.UnknownUser
		);
	}

	private isLikelyDeletedUser(username: string | null | undefined) {
		return typeof username === 'string' && username.startsWith(USERNAME_PREFIX_DELETED);
	}

	private getDuration(duration: number) {
		if (duration >= 1_000) return `${(duration / 1_000).toFixed(2)}s`;
		if (duration >= 1) return `${duration.toFixed(2)}ms`;
		return `${(duration * 1_000).toFixed(2)}μs`;
	}
}
