/* eslint-disable typescript-sort-keys/interface */
import type { $Enums, Inventory, User as PrismaUser, User } from '@prisma/client';
import { UserError, container } from '@sapphire/framework';
import { type Result, err, ok } from '@sapphire/result';
import { roundNumber } from '@sapphire/utilities';
import { bold } from 'discord.js';
import { getUser } from '#lib/database';
import { type Item } from '#lib/structures/Item';
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
	if (!raw && amount.toLowerCase() === 'half') amountToDeposit = roundNumber(data.wallet / 2, 2);
	if (!raw && amount.toLowerCase() === 'max') amountToDeposit = data.wallet;
	if (raw?.suffix === '%') amountToDeposit = roundNumber(data.wallet * (amountToDeposit / 100), 2);

	const money = Math.min(amountToDeposit, canDeposit, data.wallet);
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
		const message = ['You have no money in your bank account.'];
		if (data.wallet === 0) message.push('You are poor....');
		return err(new UserError({ identifier: 'NoMoney', message: message.join('\n') }));
	}

	if (!raw && amount.toLowerCase() === 'all') amountToWithdraw = data.bankBalance;
	if (!raw && amount.toLowerCase() === 'half') amountToWithdraw = roundNumber(data.bankBalance / 2, 2);
	if (!raw && amount.toLowerCase() === 'max') amountToWithdraw = data.bankBalance;
	if (raw?.suffix === '%') amountToWithdraw = roundNumber(data.bankBalance * (amountToWithdraw / 100), 2);

	const money = Math.min(amountToWithdraw, canWithdraw, data.bankBalance);
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

export async function handleTransfer(
	transferor: PrismaUser,
	transferee: PrismaUser,
	amount: string,
): Promise<Result<{ transferor: PrismaUser; transferee: PrismaUser; money: number }, UserError>> {
	const raw = getNumberWithSuffix(amount);
	if ((!options.has(amount.toLowerCase()) && raw === null) || (raw && raw.number <= 0)) {
		return err(
			new UserError({
				identifier: 'InvalidAmount',
				message: 'I need a valid amount greater than 0 to transfer.',
			}),
		);
	}

	let amountToTransfer = raw ? parseNumberWithSuffix(raw.number, raw.suffix) : 0;
	const canTransfer = transferor.bankBalance;
	if (canTransfer === 0) {
		return err(new UserError({ identifier: 'NoMoney', message: 'You have no money in your bank account.' }));
	}

	if (!raw && amount.toLowerCase() === 'all') amountToTransfer = transferor.bankBalance;
	if (!raw && amount.toLowerCase() === 'half') amountToTransfer = roundNumber(transferor.bankBalance / 2, 2);
	if (!raw && amount.toLowerCase() === 'max') amountToTransfer = transferor.bankBalance;
	if (raw?.suffix === '%') amountToTransfer = roundNumber(transferor.bankBalance * (amountToTransfer / 100), 2);

	const money = Math.min(amountToTransfer, canTransfer, transferor.bankBalance);
	if (money <= 0) {
		return err(
			new UserError({
				identifier: 'NotEnoughMoney',
				message: 'You do not have enough money to transfer.',
			}),
		);
	}

	const nextTransferor = await container.prisma.user.update({
		where: { id: transferor.id },
		data: { bankBalance: { decrement: money } },
	});
	const nextTransferee = await container.prisma.user.update({
		where: { id: transferee.id },
		data: { bankBalance: { increment: money } },
	});

	return ok({ transferor: nextTransferor, transferee: nextTransferee, money });
}

export function getTransactionSymbol(type: $Enums.Transaction) {
	switch (type) {
		case 'DEPOSIT':
			return bold('+');
		case 'WITHDRAW':
			return bold('\\-');
		case 'TRANSFER':
			return bold('\\-');
	}
}

export async function handleBuy(item: Item, userId: string, amount = 1): Promise<Result<User, UserError | unknown>> {
	const result = await getUser(userId);
	if (result.isErr()) return err(result.unwrapErr());

	const data = result.unwrap();

	if (data.wallet < item.price * amount) {
		return err(
			new UserError({ identifier: 'NotEnoughMoney', message: 'You do not have enough money to buy this item.' }),
		);
	}

	const next = await container.prisma.user.update({
		where: { id: userId },
		data: {
			wallet: { decrement: item.price * amount },
			Inventory: {
				connectOrCreate: { where: { id: userId }, create: { [item.id]: amount } },
				update: { [item.id]: { increment: amount } },
			},
		},
	});

	return ok(next);
}

export function getInventoryMap(data: Inventory) {
	const items = container.stores.get('items');
	const inventoryMap = new Map(Object.entries(data));
	const inventory = new Map<string, number>();

	for (const [key, value] of inventoryMap) {
		const item = items.get(key);
		if (!item) continue;
		inventory.set(key, Number.parseInt(value.toString(), 10));
	}

	return inventory;
}

export function getInventoryNetWorth(data: Inventory) {
	const items = container.stores.get('items');
	const inventory = getInventoryMap(data);
	let netWorth = 0;

	for (const [key, value] of inventory) {
		const item = items.get(key);
		if (!item) continue;
		netWorth += item.sellPrice * value;
	}

	return netWorth;
}
