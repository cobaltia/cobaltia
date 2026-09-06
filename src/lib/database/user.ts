import { type BankAccount, type BankTransaction, type User, Prisma } from '@prisma/client';
import { container } from '@sapphire/framework';
import { Result, err, ok } from '@sapphire/result';

export type UserWithBankAccount = User & { bankAccount: BankAccount };

export async function getUser(id: string): Promise<Result<User, unknown>> {
	const result = await Result.fromAsync(async () => container.prisma.user.findUniqueOrThrow({ where: { id } }));

	if (result.isErr()) {
		const error = result.unwrapErr();
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) return err(error);
		return Result.fromAsync(async () => container.prisma.user.create({ data: { id } }));
	}

	return result;
}

export async function getBankAccount(userId: string): Promise<Result<BankAccount, unknown>> {
	return Result.fromAsync(async () =>
		container.prisma.bankAccount.upsert({
			where: { userId_type: { userId, type: 'BANK' } },
			create: { userId, type: 'BANK' },
			update: {},
		}),
	);
}

export async function getUserWithBankAccount(id: string): Promise<Result<UserWithBankAccount, unknown>> {
	const userResult = await getUser(id);
	if (userResult.isErr()) return err(userResult.unwrapErr());

	const bankResult = await getBankAccount(id);
	if (bankResult.isErr()) return err(bankResult.unwrapErr());

	return ok({ ...userResult.unwrap(), bankAccount: bankResult.unwrap() });
}

export async function getBankStatement(userId: string): Promise<Result<BankTransaction[], unknown>> {
	const accountResult = await Result.fromAsync(async () =>
		container.prisma.bankAccount.findUniqueOrThrow({
			where: { userId_type: { userId, type: 'BANK' } },
		}),
	);

	if (accountResult.isErr()) {
		const error = accountResult.unwrapErr();
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) return err(error);
		return ok([]);
	}

	return Result.fromAsync(async () =>
		container.prisma.bankTransaction.findMany({
			where: { accountId: accountResult.unwrap().id },
			orderBy: { date: 'desc' },
			take: 10,
		}),
	);
}
