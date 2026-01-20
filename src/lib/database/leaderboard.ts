import {
	getGlobalUserNetworthLeaderboard,
	getGlobalUSerVcTimeLeaderboard,
	getLocalUserNetworthLeaderboard,
	getLocalUserVcTimeLeaderboard,
} from '@prisma/client/sql';
import { container } from '@sapphire/framework';
import { Result } from '@sapphire/result';

export async function getGlobalWallet(limit = 10, offset = 0) {
	return Result.fromAsync(async () =>
		container.prisma.user.findMany({
			where: { wallet: { gt: 0 } },
			orderBy: [{ wallet: 'desc' }, { bankBalance: 'desc' }, { id: 'asc' }],
			take: limit,
			skip: offset,
		}),
	);
}

export async function getLocalWallet(users: string[], limit = 10, offset = 0) {
	return Result.fromAsync(async () =>
		container.prisma.user.findMany({
			where: { id: { in: users }, wallet: { gt: 0 } },
			orderBy: [{ wallet: 'desc' }, { bankBalance: 'desc' }, { id: 'asc' }],
			take: limit,
			skip: offset,
		}),
	);
}

export async function getGlobalBank(limit = 10, offset = 0) {
	return Result.fromAsync(async () =>
		container.prisma.user.findMany({
			where: { bankBalance: { gt: 0 } },
			orderBy: [{ bankBalance: 'desc' }, { wallet: 'desc' }, { id: 'asc' }],
			take: limit,
			skip: offset,
		}),
	);
}

export async function getLocalBank(users: string[], limit = 10, offset = 0) {
	return Result.fromAsync(async () =>
		container.prisma.user.findMany({
			where: { id: { in: users }, bankBalance: { gt: 0 } },
			orderBy: [{ bankBalance: 'desc' }, { wallet: 'desc' }, { id: 'asc' }],
			take: limit,
			skip: offset,
		}),
	);
}

export async function getGlobalNetworth(limit = 10, offset = 0) {
	return Result.fromAsync(async () =>
		container.prisma.$queryRawTyped(getGlobalUserNetworthLeaderboard(limit, offset)),
	);
}

export async function getLocalNetworth(users: string[], limit = 10, offset = 0) {
	return Result.fromAsync(async () =>
		container.prisma.$queryRawTyped(getLocalUserNetworthLeaderboard(users, limit, offset)),
	);
}

export async function getGlobalLevel(limit = 10, offset = 0) {
	return Result.fromAsync(async () =>
		container.prisma.user.findMany({
			where: { level: { gt: 0 } },
			orderBy: [{ level: 'desc' }, { experience: 'desc' }, { id: 'asc' }],
			take: limit,
			skip: offset,
		}),
	);
}

export async function getLocalLevel(users: string[], limit = 10, offset = 0) {
	return Result.fromAsync(async () =>
		container.prisma.user.findMany({
			where: { id: { in: users }, level: { gt: 0 } },
			orderBy: [{ level: 'desc' }, { experience: 'desc' }, { id: 'asc' }],
			take: limit,
			skip: offset,
		}),
	);
}

export async function getGlobalSocialCredit(limit = 10, offset = 0) {
	return Result.fromAsync(async () =>
		container.prisma.user.findMany({
			where: { socialCredit: { not: 1_000 } },
			orderBy: [{ socialCredit: 'desc' }, { id: 'asc' }],
			take: limit,
			skip: offset,
		}),
	);
}

export async function getLocalSocialCredit(users: string[], limit = 10, offset = 0) {
	return Result.fromAsync(async () =>
		container.prisma.user.findMany({
			where: { id: { in: users }, socialCredit: { not: 1_000 } },
			orderBy: [{ socialCredit: 'desc' }, { id: 'asc' }],
			take: limit,
			skip: offset,
		}),
	);
}

export async function getGlobalVcTime(limit = 10, offset = 0) {
	return Result.fromAsync(async () => container.prisma.$queryRawTyped(getGlobalUSerVcTimeLeaderboard(limit, offset)));
}

export async function getLocalVcTime(guildId: string, limit = 10, offset = 0) {
	return Result.fromAsync(async () =>
		container.prisma.$queryRawTyped(getLocalUserVcTimeLeaderboard(guildId, limit, offset)),
	);
}
