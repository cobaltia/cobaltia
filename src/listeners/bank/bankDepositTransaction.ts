import { Listener } from '@sapphire/framework';
import type { User } from 'discord.js';
import { Events } from '#lib/types';

export class BankDepositTransaction extends Listener<typeof Events.BankDepositTransaction> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.RawBankTransaction,
		});
	}

	public async run(user: User, amount: number, description: string[]) {
		console.log('DEPOSIT is being emitted');
		const data = await this.container.prisma.bankTransaction.create({
			data: {
				amount,
				type: 'DEPOSIT',
				description,
				account: { connect: { id: user.id } },
			},
		});
		console.log('Prisma', data);
	}
}
