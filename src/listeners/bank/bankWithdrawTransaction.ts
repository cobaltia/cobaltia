import { Listener } from '@sapphire/framework';
import type { User } from 'discord.js';
import { Events } from '#lib/types';

export class BankWithdrawTransaction extends Listener<typeof Events.BankWithdrawTransaction> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.BankWithdrawTransaction,
		});
	}

	public async run(user: User, amount: number, description: string[]) {
		await this.container.prisma.bankTransaction.create({
			data: {
				amount,
				type: 'WITHDRAW',
				description,
				account: { connect: { id: user.id } },
			},
		});
	}
}
