import type { $Enums } from '@prisma/client';
import { Listener } from '@sapphire/framework';
import type { User } from 'discord.js';
import { Events } from '#lib/types';

export class RawBankTransaction extends Listener<typeof Events.RawBankTransaction> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.RawBankTransaction,
		});
	}

	public run(
		user: User,
		receiver: User | null,
		amount: number,
		transactionType: $Enums.Transaction,
		description: string[],
	) {
		if (transactionType === 'DEPOSIT') {
			this.container.client.emit(Events.BankDepositTransaction, user, amount, description);
			return;
		}

		if (transactionType === 'WITHDRAW') {
			this.container.client.emit(Events.BankWithdrawTransaction, user, amount, description);
			return;
		}

		if (transactionType === 'TRANSFER') {
			this.container.client.emit(Events.BankTransferTransaction, user, receiver!, amount, description);
		}
	}
}
