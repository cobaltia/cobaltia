import { type BankTransaction, Prisma, type User } from '@prisma/client';
import { container } from '@sapphire/framework';
import { Result, err } from '@sapphire/result';

export async function getUser(id: string): Promise<Result<User, unknown>> {
	const result = await Result.fromAsync(async () => container.prisma.user.findUniqueOrThrow({ where: { id } }));

	if (result.isErr()) {
		const error = result.unwrapErr();
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) return err(error);
		return Result.fromAsync(async () => container.prisma.user.create({ data: { id } }));
	}

	return result;
}

export async function getBankStatement(id: string): Promise<Result<BankTransaction[], unknown>> {
	const result = await Result.fromAsync(async () =>
		container.prisma.bankTransaction.findMany({ where: { accountId: id }, orderBy: { date: 'desc' }, take: 10 }),
	);

	if (result.isErr()) {
		const error = result.unwrapErr();
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) return err(error);
	}

	return result;
}

// TODO(Isidro): Implement updateUserWallet function or something similar
// export async function updateUserWallet(
// 	id: string,
// 	amount: number,
// 	metadata: { channel: string; command: string; gulid: string; type: 'earn' | 'lose' },
// ): Promise<Result<User, unknown>> {
// 	const result = await Result.fromAsync(async () => {
// 		await container.prisma.user.upsert({
// 			where: { id },
// 			create: { id, wallet: metadata.type === 'earn' ? amount : -amount },
// 			update: { wallet: { [metadata.type === 'earn' ? 'increment' : 'decrement']: amount } },
// 		});
// 	});
// 	container.metrics.updateMoney({
// 		command: metadata.command,
// 		user: id,
// 		guild: metadata.gulid,
// 		channel: metadata.channel,
// 		type: metadata.type,
// 		value: amount,
// 	});

// 	return result;
// }
