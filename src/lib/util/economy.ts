/* eslint-disable typescript-sort-keys/interface */
import type { $Enums, User as PrismaUser, User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { UserError, container } from '@sapphire/framework';
import { type Subcommand } from '@sapphire/plugin-subcommands';
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

	let amountToDeposit = raw ? new Decimal(parseNumberWithSuffix(raw.number, raw.suffix)) : new Decimal(0);
	const canDeposit = data.bankLimit.sub(data.bankBalance);
	if (canDeposit.equals(0)) {
		return err(new UserError({ identifier: 'BankLimitReached', message: 'You have no bank space left.' }));
	}

	if (!raw && amount.toLowerCase() === 'all') amountToDeposit = data.wallet;
	if (!raw && amount.toLowerCase() === 'half')
		amountToDeposit = new Decimal(roundNumber(data.wallet.div(2).toNumber(), 2));
	if (!raw && amount.toLowerCase() === 'max') amountToDeposit = data.wallet;
	if (raw?.suffix === '%')
		amountToDeposit = new Decimal(roundNumber(data.wallet.mul(amountToDeposit.div(100)).toNumber(), 2));

	const money = Math.min(amountToDeposit.toNumber(), canDeposit.toNumber(), data.wallet.toNumber());
	if (money <= 0) {
		return err(
			new UserError({ identifier: 'NotEnoughMoney', message: 'You do not have enough money to deposit.' }),
		);
	}

	const next = await container.prisma.user.update({
		where: { id: data.id },
		data: { wallet: data.wallet.sub(money), bankBalance: data.bankBalance.add(money) },
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

	let amountToWithdraw = raw ? new Decimal(parseNumberWithSuffix(raw.number, raw.suffix)) : new Decimal(0);
	const canWithdraw = data.bankBalance;

	if (canWithdraw.equals(0)) {
		const message = ['You have no money in your bank account.'];
		if (data.wallet.equals(0)) message.push('You are poor....');
		return err(new UserError({ identifier: 'NoMoney', message: message.join('\n') }));
	}

	if (!raw && amount.toLowerCase() === 'all') amountToWithdraw = data.bankBalance;
	if (!raw && amount.toLowerCase() === 'half')
		amountToWithdraw = new Decimal(roundNumber(data.bankBalance.div(2).toNumber(), 2));
	if (!raw && amount.toLowerCase() === 'max') amountToWithdraw = data.bankBalance;
	if (raw?.suffix === '%')
		amountToWithdraw = new Decimal(roundNumber(data.bankBalance.mul(amountToWithdraw.div(100)).toNumber(), 2));

	const money = Math.min(amountToWithdraw.toNumber(), canWithdraw.toNumber(), data.bankBalance.toNumber());
	if (money <= 0) {
		return err(
			new UserError({ identifier: 'NotEnoughMoney', message: 'You do not have enough money to withdraw.' }),
		);
	}

	const next = await container.prisma.user.update({
		where: { id: data.id },
		data: { wallet: data.wallet.add(money), bankBalance: data.bankBalance.sub(money) },
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

	let amountToTransfer = raw ? new Decimal(parseNumberWithSuffix(raw.number, raw.suffix)) : new Decimal(0);
	const canTransfer = transferor.bankBalance;
	if (canTransfer.equals(0)) {
		return err(new UserError({ identifier: 'NoMoney', message: 'You have no money in your bank account.' }));
	}

	if (!raw && amount.toLowerCase() === 'all') amountToTransfer = transferor.bankBalance;
	if (!raw && amount.toLowerCase() === 'half')
		amountToTransfer = new Decimal(roundNumber(transferor.bankBalance.div(2).toNumber(), 2));
	if (!raw && amount.toLowerCase() === 'max') amountToTransfer = transferor.bankBalance;
	if (raw?.suffix === '%')
		amountToTransfer = new Decimal(
			roundNumber(transferor.bankBalance.mul(amountToTransfer.div(100)).toNumber(), 2),
		);

	const money = Math.min(amountToTransfer.toNumber(), canTransfer.toNumber(), transferor.bankBalance.toNumber());
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

export async function handleBuy(
	item: Item,
	interaction: Subcommand.ChatInputCommandInteraction,
	amount = 1,
): Promise<Result<User, UserError | unknown>> {
	const result = await getUser(interaction.user.id);
	if (result.isErr()) return err(result.unwrapErr());

	const data = result.unwrap();

	if (data.wallet.lessThan(item.price * amount)) {
		return err(
			new UserError({ identifier: 'NotEnoughMoney', message: 'You do not have enough money to buy this item.' }),
		);
	}

	const next = await container.prisma.user.update({
		where: { id: interaction.user.id },
		data: {
			wallet: { decrement: item.price * amount },
			Inventory: {
				upsert: {
					where: { userId_itemId: { userId: interaction.user.id, itemId: item.name } },
					create: { itemId: item.name, quantity: amount },
					update: { quantity: { increment: amount } },
				},
			},
		},
	});

	container.metrics.incrementMoneyLost({
		command: interaction.commandName,
		user: interaction.user.id,
		guild: interaction.guildId ?? 'none',
		channel: interaction.channelId,
		reason: 'store',
		value: item.price * amount,
	});

	return ok(next);
}
