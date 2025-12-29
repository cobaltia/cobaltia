import { Decimal } from '@prisma/client/runtime/library';
import { container, UserError } from '@sapphire/framework';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleDeposit, handleWithdraw, handleTransfer, getTransactionSymbol, handleBuy } from '#lib/util/economy';

// We will mock external dependencies used within economy utilities.
vi.mock('#lib/database', () => {
	return {
		getUser: vi.fn(),
	};
});

// Utility to build a minimal PrismaUser-like object with Decimal fields
function makeUser(overrides: Partial<any> = {}) {
	return {
		id: overrides.id ?? 'user-1',
		wallet: overrides.wallet ?? new Decimal(0),
		bankBalance: overrides.bankBalance ?? new Decimal(0),
		bankLimit: overrides.bankLimit ?? new Decimal(0),
		// Any other fields not used by the tested functions can be omitted
	};
}

describe('economy utilities', () => {
	let prismaUpdateSpy: ReturnType<typeof vi.fn>;
	let prismaUpdateSpyUser2: ReturnType<typeof vi.fn>;
	let metricsSpy: ReturnType<typeof vi.fn>;
	let getUserMock: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		// Mock container.prisma.user.update
		(container as any).prisma = (container as any).prisma ?? {};
		(container as any).prisma.user = (container as any).prisma.user ?? {};
		prismaUpdateSpy = vi.fn();
		(container as any).prisma.user.update = prismaUpdateSpy;

		// Mock metrics.incrementMoneyLost
		(container as any).metrics = (container as any).metrics ?? {};
		metricsSpy = vi.fn();
		(container as any).metrics.incrementMoneyLost = metricsSpy;

		// Reset mocked getUser
		const mod = await import('#lib/database');
		getUserMock = mod.getUser as ReturnType<typeof vi.fn>;
		getUserMock.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('handleDeposit', () => {
		test('rejects invalid amount (non-option and not a number)', async () => {
			const user = makeUser({
				wallet: new Decimal(100),
				bankBalance: new Decimal(0),
				bankLimit: new Decimal(500),
			});

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleDeposit(user, 'abc');
			expect(res.isErr()).toBe(true);
			const error = res.unwrapErr();
			expect(error).toBeInstanceOf(UserError);
			expect(error.identifier).toBe('InvalidAmount');
		});

		test('rejects non-positive numeric amount', async () => {
			const user = makeUser({
				wallet: new Decimal(100),
				bankBalance: new Decimal(0),
				bankLimit: new Decimal(500),
			});

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleDeposit(user, '0');
			expect(res.isErr()).toBe(true);
			expect(res.unwrapErr().identifier).toBe('InvalidAmount');
		});

		test('rejects when bank limit reached', async () => {
			const user = makeUser({
				wallet: new Decimal(100),
				bankBalance: new Decimal(500),
				bankLimit: new Decimal(500),
			});

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleDeposit(user, 'all');
			expect(res.isErr()).toBe(true);
			expect(res.unwrapErr().identifier).toBe('BankLimitReached');
		});

		test('deposits "all" up to bank space and wallet', async () => {
			// Wallet 300, bank balance 200, limit 400 -> space = 200 -> deposit min(300,200,300)=200
			const user = makeUser({
				id: 'user-1',
				wallet: new Decimal(300),
				bankBalance: new Decimal(200),
				bankLimit: new Decimal(400),
			});

			const updatedUser = makeUser({
				id: 'user-1',
				wallet: new Decimal(100),
				bankBalance: new Decimal(400),
				bankLimit: new Decimal(400),
			});
			prismaUpdateSpy.mockResolvedValue(updatedUser);

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleDeposit(user, 'all');
			expect(res.isOk()).toBe(true);
			const payload = res.unwrap();
			expect(payload.money).toBe(200);
			expect(payload.next.bankBalance.toNumber()).toBe(400);
			expect(prismaUpdateSpy).toHaveBeenCalledWith({
				where: { id: 'user-1' },
				data: { wallet: new Decimal(300).sub(200), bankBalance: new Decimal(200).add(200) },
			});
		});

		test('deposits "half" of wallet, rounded to 2 decimals', async () => {
			const user = makeUser({
				id: 'user-2',
				wallet: new Decimal(101),
				bankBalance: new Decimal(0),
				bankLimit: new Decimal(1_000),
			});
			// half of 101 = 50.5
			const updatedUser = makeUser({
				id: 'user-2',
				wallet: new Decimal(50.5),
				bankBalance: new Decimal(50.5),
				bankLimit: new Decimal(1_000),
			});
			prismaUpdateSpy.mockResolvedValue(updatedUser);

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleDeposit(user, 'half');
			expect(res.isOk()).toBe(true);
			const payload = res.unwrap();
			expect(payload.money).toBe(50.5);
			expect(prismaUpdateSpy).toHaveBeenCalledWith({
				where: { id: 'user-2' },
				data: { wallet: new Decimal(101).sub(50.5), bankBalance: new Decimal(0).add(50.5) },
			});
		});

		test('deposits with percentage suffix', async () => {
			const user = makeUser({
				id: 'user-3',
				wallet: new Decimal(200),
				bankBalance: new Decimal(0),
				bankLimit: new Decimal(1_000),
			});
			// 25% of wallet = 50
			const updatedUser = makeUser({
				id: 'user-3',
				wallet: new Decimal(150),
				bankBalance: new Decimal(50),
				bankLimit: new Decimal(1_000),
			});
			prismaUpdateSpy.mockResolvedValue(updatedUser);

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleDeposit(user, '25%');
			expect(res.isOk()).toBe(true);
			const payload = res.unwrap();
			expect(payload.money).toBe(50);
			expect(prismaUpdateSpy).toHaveBeenCalledWith({
				where: { id: 'user-3' },
				data: { wallet: new Decimal(200).sub(50), bankBalance: new Decimal(0).add(50) },
			});
		});

		test('fails with NotEnoughMoney when wallet is zero', async () => {
			const user = makeUser({
				id: 'user-4',
				wallet: new Decimal(0),
				bankBalance: new Decimal(0),
				bankLimit: new Decimal(100),
			});
			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleDeposit(user, '10');
			expect(res.isErr()).toBe(true);
			expect(res.unwrapErr().identifier).toBe('NotEnoughMoney');
			expect(prismaUpdateSpy).not.toHaveBeenCalled();
		});
	});

	describe('handleWithdraw', () => {
		test('rejects invalid amount', async () => {
			const user = makeUser({
				wallet: new Decimal(0),
				bankBalance: new Decimal(100),
				bankLimit: new Decimal(1_000),
			});
			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleWithdraw(user, 'xyz');
			expect(res.isErr()).toBe(true);
			expect(res.unwrapErr().identifier).toBe('InvalidAmount');
		});

		test('rejects when bank has no money (with poor message addition)', async () => {
			const user = makeUser({
				wallet: new Decimal(0),
				bankBalance: new Decimal(0),
				bankLimit: new Decimal(1_000),
			});
			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleWithdraw(user, 'all');
			expect(res.isErr()).toBe(true);
			const err = res.unwrapErr();
			expect(err.identifier).toBe('NoMoney');
			expect(err.message).toContain('You have no money in your bank account.');
			expect(err.message).toContain('You are poor');
		});

		test('withdraws "all"', async () => {
			const user = makeUser({
				id: 'user-w1',
				wallet: new Decimal(10),
				bankBalance: new Decimal(90),
				bankLimit: new Decimal(1_000),
			});
			const updatedUser = makeUser({
				id: 'user-w1',
				wallet: new Decimal(100),
				bankBalance: new Decimal(0),
				bankLimit: new Decimal(1_000),
			});
			prismaUpdateSpy.mockResolvedValue(updatedUser);

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleWithdraw(user, 'all');
			expect(res.isOk()).toBe(true);
			const payload = res.unwrap();
			expect(payload.money).toBe(90);
			expect(prismaUpdateSpy).toHaveBeenCalledWith({
				where: { id: 'user-w1' },
				data: { wallet: new Decimal(10).add(90), bankBalance: new Decimal(90).sub(90) },
			});
		});

		test('withdraws "half" of bank balance, rounded to 2 decimals', async () => {
			const user = makeUser({
				id: 'user-w2',
				wallet: new Decimal(0),
				bankBalance: new Decimal(101),
				bankLimit: new Decimal(1_000),
			});
			const updatedUser = makeUser({
				id: 'user-w2',
				wallet: new Decimal(50.5),
				bankBalance: new Decimal(50.5),
				bankLimit: new Decimal(1_000),
			});
			prismaUpdateSpy.mockResolvedValue(updatedUser);

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleWithdraw(user, 'half');
			expect(res.isOk()).toBe(true);
			const payload = res.unwrap();
			expect(payload.money).toBe(50.5);
			expect(prismaUpdateSpy).toHaveBeenCalledWith({
				where: { id: 'user-w2' },
				data: { wallet: new Decimal(0).add(50.5), bankBalance: new Decimal(101).sub(50.5) },
			});
		});

		test('withdraws with percentage suffix', async () => {
			const user = makeUser({
				id: 'user-w3',
				wallet: new Decimal(0),
				bankBalance: new Decimal(200),
				bankLimit: new Decimal(1_000),
			});
			const updatedUser = makeUser({
				id: 'user-w3',
				wallet: new Decimal(50),
				bankBalance: new Decimal(150),
				bankLimit: new Decimal(1_000),
			});
			prismaUpdateSpy.mockResolvedValue(updatedUser);

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleWithdraw(user, '25%');
			expect(res.isOk()).toBe(true);
			const payload = res.unwrap();
			expect(payload.money).toBe(50);
			expect(prismaUpdateSpy).toHaveBeenCalledWith({
				where: { id: 'user-w3' },
				data: { wallet: new Decimal(0).add(50), bankBalance: new Decimal(200).sub(50) },
			});
		});

		test('fails NotEnoughMoney when requested amount <= 0', async () => {
			const user = makeUser({
				id: 'user-w4',
				wallet: new Decimal(100),
				bankBalance: new Decimal(100),
				bankLimit: new Decimal(1_000),
			});
			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleWithdraw(user, '0');
			expect(res.isErr()).toBe(true);
			expect(res.unwrapErr().identifier).toBe('InvalidAmount'); // 0 triggers invalid amount
		});
	});

	describe('handleTransfer', () => {
		test('rejects invalid amount', async () => {
			const from = makeUser({ bankBalance: new Decimal(100) });
			const to = makeUser({ id: 'user-2', bankBalance: new Decimal(0) });

			const res = await handleTransfer(from, to, 'nope');
			expect(res.isErr()).toBe(true);
			expect(res.unwrapErr().identifier).toBe('InvalidAmount');
		});

		test('rejects when no money to transfer', async () => {
			const from = makeUser({ bankBalance: new Decimal(0) });
			const to = makeUser({ id: 'user-2', bankBalance: new Decimal(0) });

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleTransfer(from, to, 'all');
			expect(res.isErr()).toBe(true);
			expect(res.unwrapErr().identifier).toBe('NoMoney');
		});

		test('transfers "half" of bank balance and updates both users', async () => {
			const from = makeUser({ id: 'user-t1', bankBalance: new Decimal(101) });
			const to = makeUser({ id: 'user-t2', bankBalance: new Decimal(50) });

			const updatedFrom = makeUser({ id: 'user-t1', bankBalance: new Decimal(50.5) });
			const updatedTo = makeUser({ id: 'user-t2', bankBalance: new Decimal(100.5) });

			// We need to handle two updates sequentially; reuse same spy with conditional resolution
			let callIndex = 0;
			prismaUpdateSpy.mockImplementation(async (arg: any) => {
				callIndex++;
				if (callIndex === 1) return updatedFrom;
				return updatedTo;
			});

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleTransfer(from, to, 'half');
			expect(res.isOk()).toBe(true);
			const payload = res.unwrap();
			expect(payload.money).toBe(50.5);
			expect(payload.transferor.bankBalance.toNumber()).toBe(50.5);
			expect(payload.transferee.bankBalance.toNumber()).toBe(100.5);

			// First update: decrement from transferor
			expect(prismaUpdateSpy).toHaveBeenNthCalledWith(1, {
				where: { id: 'user-t1' },
				data: { bankBalance: { decrement: 50.5 } },
			});
			// Second update: increment transferee
			expect(prismaUpdateSpy).toHaveBeenNthCalledWith(2, {
				where: { id: 'user-t2' },
				data: { bankBalance: { increment: 50.5 } },
			});
		});

		test('transfers percentage of bank balance', async () => {
			const from = makeUser({ id: 'user-t3', bankBalance: new Decimal(200) });
			const to = makeUser({ id: 'user-t4', bankBalance: new Decimal(0) });

			const updatedFrom = makeUser({ id: 'user-t3', bankBalance: new Decimal(150) });
			const updatedTo = makeUser({ id: 'user-t4', bankBalance: new Decimal(50) });

			let callIndex = 0;
			prismaUpdateSpy.mockImplementation(async (arg: any) => {
				callIndex++;
				return callIndex === 1 ? updatedFrom : updatedTo;
			});

			// @ts-expect-error: to bypass type checking for invalid input
			const res = await handleTransfer(from, to, '25%');
			expect(res.isOk()).toBe(true);
			const payload = res.unwrap();
			expect(payload.money).toBe(50);
			expect(prismaUpdateSpy).toHaveBeenNthCalledWith(1, {
				where: { id: 'user-t3' },
				data: { bankBalance: { decrement: 50 } },
			});
			expect(prismaUpdateSpy).toHaveBeenNthCalledWith(2, {
				where: { id: 'user-t4' },
				data: { bankBalance: { increment: 50 } },
			});
		});
	});

	describe('getTransactionSymbol', () => {
		test('returns + for DEPOSIT', () => {
			expect(getTransactionSymbol('DEPOSIT')).toContain('+');
		});

		test('returns - for WITHDRAW', () => {
			const sym = getTransactionSymbol('WITHDRAW');
			expect(sym).toContain('-');
		});

		test('returns - for TRANSFER', () => {
			const sym = getTransactionSymbol('TRANSFER');
			expect(sym).toContain('-');
		});
	});

	describe('handleBuy', () => {
		test('fails when user has insufficient wallet', async () => {
			// Mock getUser to return a user with low wallet
			const mod = await import('#lib/database');
			const userData = makeUser({ id: 'buyer-1', wallet: new Decimal(10) });
			(mod.getUser as any).mockResolvedValue({
				isErr: () => false,
				isOk: () => true,
				unwrap: () => userData,
				unwrapErr: () => new Error('should not be called'),
			});

			const interaction = {
				user: { id: 'buyer-1' },
				guildId: 'guild-1',
				channelId: 'channel-1',
				commandName: 'buy',
			} as any;

			const item = { name: 'item-1', price: 100 } as any;

			const res = await handleBuy(item, interaction, 1);
			expect(res.isErr()).toBe(true);
			const err = res.unwrapErr();
			expect(err).toBeInstanceOf(UserError);
			// @ts-expect-error: to bypass type checking for invalid input
			expect(err.identifier).toBe('NotEnoughMoney');
			expect(prismaUpdateSpy).not.toHaveBeenCalled();
			expect(metricsSpy).not.toHaveBeenCalled();
		});

		test('succeeds and updates inventory and metrics', async () => {
			const mod = await import('#lib/database');
			const userData = makeUser({ id: 'buyer-2', wallet: new Decimal(500) });
			(mod.getUser as any).mockResolvedValue({
				isErr: () => false,
				isOk: () => true,
				unwrap: () => userData,
				unwrapErr: () => new Error('should not be called'),
			});

			const interaction = {
				user: { id: 'buyer-2' },
				guildId: 'guild-2',
				channelId: 'channel-2',
				commandName: 'buy',
			} as any;

			const item = { name: 'sword', price: 100 } as any;

			const updatedUser = { ...userData }; // we can return same user shape for simplicity
			prismaUpdateSpy.mockResolvedValue(updatedUser);

			const res = await handleBuy(item, interaction, 2); // price*amount = 200
			expect(res.isOk()).toBe(true);

			// Ensure prisma update was called with upsert on Inventory
			expect(prismaUpdateSpy).toHaveBeenCalledWith({
				where: { id: 'buyer-2' },
				data: {
					wallet: { decrement: 200 },
					Inventory: {
						upsert: {
							where: { userId_itemId: { userId: 'buyer-2', itemId: 'sword' } },
							create: { itemId: 'sword', quantity: 2 },
							update: { quantity: { increment: 2 } },
						},
					},
				},
			});

			// Metrics should be incremented with correct payload
			expect(metricsSpy).toHaveBeenCalledWith({
				command: 'buy',
				user: 'buyer-2',
				guild: 'guild-2',
				channel: 'channel-2',
				reason: 'store',
				value: 200,
			});
		});

		test('propagates error from getUser', async () => {
			const mod = await import('#lib/database');
			const testErr = new Error('db failure');
			(mod.getUser as any).mockResolvedValue({
				isErr: () => true,
				isOk: () => false,
				unwrap: () => {
					throw new Error('should not be called');
				},
				unwrapErr: () => testErr,
			});

			const interaction = {
				user: { id: 'buyer-3' },
				guildId: 'guild-3',
				channelId: 'channel-3',
				commandName: 'buy',
			} as any;

			const item = { name: 'potion', price: 50 } as any;

			const res = await handleBuy(item, interaction, 1);
			expect(res.isErr()).toBe(true);
			expect(res.unwrapErr()).toBe(testErr);
			expect(prismaUpdateSpy).not.toHaveBeenCalled();
			expect(metricsSpy).not.toHaveBeenCalled();
		});
	});
});
