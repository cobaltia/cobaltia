/* eslint-disable typescript-sort-keys/interface */
import type { User as PrismaUser } from '@prisma/client';
import { UserError, container } from '@sapphire/framework';
import { type Result, err, ok } from '@sapphire/result';
import { roundNumber } from '@sapphire/utilities';
import { getNumberWithSuffix, parseNumberWithSuffix } from '#util/common';

export const options = new Set<string>(['all', 'half', 'max']);

export async function handleDeposit(
	data: PrismaUser,
	amount: string,
): Promise<Result<{ next: PrismaUser; money: number }, UserError>> {
	const raw = getNumberWithSuffix(amount);
	if ((!options.has(amount.toLowerCase()) && raw === null) || (raw && raw.number <= 0)) {
		return err(
			new UserError({ identifier: 'InvalidAmount', message: 'I need a valid amount greater than 0 to deposit.' }),
		);
	}

	let amountToDeposit = raw ? parseNumberWithSuffix(raw.number, raw.suffix) : 0;
	const canDeposit = data.bankLimit - data.bankBalance;
	if (canDeposit === 0) {
		return err(new UserError({ identifier: 'BankLimitReached', message: 'You have no bank space left.' }));
	}

	if (!raw && amount.toLowerCase() === 'all') amountToDeposit = data.wallet;
	if (!raw && amount.toLowerCase() === 'half') amountToDeposit = roundNumber(data.wallet / 2);
	if (!raw && amount.toLowerCase() === 'max') amountToDeposit = data.wallet;
	if (raw?.suffix === '%') amountToDeposit = roundNumber(data.wallet * (amountToDeposit / 100));

	const money = Math.min(amountToDeposit, canDeposit);
	if (money <= 0) {
		return err(
			new UserError({ identifier: 'NotEnoughMoney', message: 'You do not have enough money to deposit.' }),
		);
	}

	const next = await container.prisma.user.update({
		where: { id: data.id },
		data: { wallet: data.wallet - money, bankBalance: data.bankBalance + money },
	});

	return ok({ next, money });
}

export async function handleWithdraw(
	data: PrismaUser,
	amount: string,
): Promise<Result<{ next: PrismaUser; money: number }, UserError>> {
	const raw = getNumberWithSuffix(amount);
	if ((!options.has(amount.toLowerCase()) && raw === null) || (raw && raw.number <= 0)) {
		return err(
			new UserError({
				identifier: 'InvalidAmount',
				message: 'I need a valid amount greater than 0 to withdraw.',
			}),
		);
	}

	let amountToWithdraw = raw ? parseNumberWithSuffix(raw.number, raw.suffix) : 0;
	const canWithdraw = data.bankBalance;

	if (canWithdraw === 0) {
		return err(new UserError({ identifier: 'NoMoney', message: 'You have no money in your bank account.' }));
	}

	if (!raw && amount.toLowerCase() === 'all') amountToWithdraw = data.bankBalance;
	if (!raw && amount.toLowerCase() === 'half') amountToWithdraw = roundNumber(data.bankBalance / 2);
	if (!raw && amount.toLowerCase() === 'max') amountToWithdraw = data.bankBalance;
	if (raw?.suffix === '%') amountToWithdraw = roundNumber(data.bankBalance * (amountToWithdraw / 100));

	const money = Math.min(amountToWithdraw, canWithdraw);
	if (money <= 0) {
		return err(
			new UserError({ identifier: 'NotEnoughMoney', message: 'You do not have enough money to withdraw.' }),
		);
	}

	const next = await container.prisma.user.update({
		where: { id: data.id },
		data: { wallet: data.wallet + money, bankBalance: data.bankBalance - money },
	});

	return ok({ next, money });
}
