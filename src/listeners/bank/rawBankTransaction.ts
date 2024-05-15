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

	public async run(
		user: User,
		receiver: User | null,
		amount: number,
		type: $Enums.Transaction,
		description: string[],
	) {
		switch (type) {
			case 'DEPOSIT':
				this.container.client.emit(Events.BankDepositTransaction, user, amount, description);
				break;
			case 'WITHDRAW':
				this.container.client.emit(Events.BankWithdrawTransaction, user, amount, description);
				break;
			case 'TRANSFER':
				this.container.client.emit(Events.BankTransferTransaction, user, receiver!, amount, description);
				break;
			default:
				throw new Error('Invalid transaction type');
		}
	}
}
