import process from 'node:process';
import { PrismaClient } from '@prisma/client';
import { container } from '@sapphire/framework';

const prisma = new PrismaClient({
	log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
}).$extends({
	result: {
		user: {
			netWorth: {
				needs: { wallet: true, bankBalance: true },
				compute(user) {
					return user.wallet + user.bankBalance;
				},
			},
		},
	},
});

container.prisma = prisma;

declare module '@sapphire/framework' {
	interface Container {
		prisma: typeof prisma;
	}
}
