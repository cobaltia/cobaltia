import { container } from '@sapphire/framework';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextLevel, handleExperience } from '#lib/util/experience';

describe('nextLevel', () => {
	test('known small levels', () => {
		expect(nextLevel(0).unwrap()).toBe(100);
		expect(nextLevel(1).unwrap()).toBe(155);
		expect(nextLevel(2).unwrap()).toBe(220);
		expect(nextLevel(3).unwrap()).toBe(295);
		expect(nextLevel(4).unwrap()).toBe(380);
		expect(nextLevel(5).unwrap()).toBe(475);
		expect(nextLevel(10).unwrap()).toBe(5 * 10 * 10 + 50 * 10 + 100); // 1100
	});

	test('monotonicity: required exp increases with level', () => {
		let prev = nextLevel(0).unwrap();
		for (let level = 1; level <= 100; level++) {
			const cur = nextLevel(level).unwrap();
			expect(cur).toBeGreaterThan(prev);
			prev = cur;
		}
	});

	test('formula verification for a range of levels', () => {
		for (let level = 0; level <= 50; level++) {
			const expected = 5 * level ** 2 + 50 * level + 100;
			expect(nextLevel(level).unwrap()).toBe(expected);
		}
	});

	test('boundary: negative levels return none', () => {
		expect(nextLevel(-1).isNone()).toBe(true);
		expect(nextLevel(-5).isNone()).toBe(true);
	});

	test('large level values compute correctly', () => {
		const level = 1_000;
		const expected = 5 * level ** 2 + 50 * level + 100; // 5,050,100
		expect(nextLevel(level).unwrap()).toBe(expected);
	});
});

describe('handleExperience', () => {
	const baseUser = {
		id: 'user-1',
		level: 0,
		experience: 0,
		wallet: 0,
		bank_balance: 0,
	} as any; // Minimal shape for PrismaUser used in tests

	let updateSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Ensure container.prisma.user.update exists and is mocked
		(container as any).prisma = (container as any).prisma ?? {};
		(container as any).prisma.user = (container as any).prisma.user ?? {};
		updateSpy = vi.fn();
		(container as any).prisma.user.update = updateSpy;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('levels up when added experience meets or exceeds next level requirement', async () => {
		// nextLevel(0) = 100 -> give exactly 100
		const user = { ...baseUser, level: 0, experience: 0 };

		// Mock prisma update to return the updated user object
		updateSpy.mockResolvedValue({
			...user,
			level: 1,
			experience: 0, // newExp = 0 - 100 + 100 = 0
		});

		const result = await handleExperience(100, user);
		expect(result.isOk()).toBe(true);

		const value = result.unwrap();
		expect(value && typeof value === 'object').toBe(true);
		expect((value as any).level).toBe(1);
		expect((value as any).experience).toBe(0);

		// Ensure prisma update was called with correct payload
		expect(updateSpy).toHaveBeenCalledWith({
			where: { id: user.id },
			data: { experience: 0, level: 1 },
		});
	});

	test('does not level up when added experience is below next level requirement', async () => {
		// nextLevel(0) = 100 -> give 99
		const user = { ...baseUser, level: 0, experience: 0 };

		// Mock prisma update to reflect only experience increase
		updateSpy.mockResolvedValue({
			...user,
			level: 0,
			experience: 99,
		});

		const result = await handleExperience(99, user);
		expect(result.isOk()).toBe(true);
		expect(result.unwrap()).toBe(false);

		expect(updateSpy).toHaveBeenCalledWith({
			where: { id: user.id },
			data: { experience: 99 },
		});
	});

	test('returns error when current level is invalid (negative)', async () => {
		const user = { ...baseUser, level: -1, experience: 0 };

		const result = await handleExperience(50, user);
		expect(result.isErr()).toBe(true);
		expect(result.unwrapErr().message).toContain('Level -1 is not a valid level');

		// Should not attempt any prisma updates when level is invalid
		expect(updateSpy).not.toHaveBeenCalled();
	});

	test('levels up with carry-over experience beyond next level threshold', async () => {
		// nextLevel(0) = 100, user already has 60 experience, add 50 -> 110 total
		// newExp = 60 - 100 + 50 = 10
		const user = { ...baseUser, level: 0, experience: 60 };

		updateSpy.mockResolvedValue({
			...user,
			level: 1,
			experience: 10,
		});

		const result = await handleExperience(50, user);
		expect(result.isOk()).toBe(true);

		const value = result.unwrap();
		expect((value as any).level).toBe(1);
		expect((value as any).experience).toBe(10);

		expect(updateSpy).toHaveBeenCalledWith({
			where: { id: user.id },
			data: { experience: 10, level: 1 },
		});
	});
});
