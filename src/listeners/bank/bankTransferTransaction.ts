import { Listener } from '@sapphire/framework';
import type { User } from 'discord.js';
import { Events } from '#lib/types';

export class BankTransferTransaction extends Listener<typeof Events.BankTransferTransaction> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.RawBankTransaction,
		});
	}

	public async run(user: User, receiver: User, amount: number, description: string[]) {
		await this.container.prisma.bankTransaction.create({
			data: {
				amount,
				type: 'TRANSFER',
				description,
				account: { connect: { id: user.id } },
			},
		});

		// TODO(Isidro): Fix receiver bank transaction description
		await this.container.prisma.bankTransaction.create({
			data: {
				amount,
				type: 'DEPOSIT',
				description,
				account: { connect: { id: receiver.id } },
			},
		});
	}
}
