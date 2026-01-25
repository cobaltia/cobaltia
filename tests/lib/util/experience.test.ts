import type { User as PrismaUser } from '@prisma/client';
import { container } from '@sapphire/framework';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { handleExperience, nextLevel } from '#util/experience';

const BASE_USER = {
	id: 'user-id',
	level: 1,
	experience: 0,
} as unknown as PrismaUser;

function createUser(overrides: Partial<PrismaUser> = {}): PrismaUser {
	return {
		...(BASE_USER as Record<string, unknown>),
		...overrides,
	} as PrismaUser;
}

interface UpdateArgs {
	data: Partial<PrismaUser>;
	where: { id: string };
}
type PrismaUpdateMock = ReturnType<typeof vi.fn<[UpdateArgs], Promise<PrismaUser>>>;
let prismaUpdate: PrismaUpdateMock;

beforeEach(() => {
	prismaUpdate = vi.fn<[UpdateArgs], Promise<PrismaUser>>(async ({ where, data }: UpdateArgs) =>
		createUser({ id: where.id, ...data }),
	);
	(container as any).prisma = {
		user: {
			update: prismaUpdate,
		},
	};
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('nextLevel', () => {
	it('returns quadratic requirement for non-negative levels', () => {
		const requirement = nextLevel(5);
		expect(requirement.isSome()).toBe(true);
		expect(requirement.unwrap()).toBe(475);
	});

	it('returns none when level is negative', () => {
		expect(nextLevel(-1).isNone()).toBe(true);
	});
});

describe('handleExperience', () => {
	it('stores accumulated experience when no level up occurs', async () => {
		const user = createUser({ id: 'no-level', level: 3, experience: 25 });
		const result = await handleExperience(10, user);
		expect(result.isOk()).toBe(true);
		expect(result.unwrap()).toBe(false);
		expect(prismaUpdate).toHaveBeenCalledWith({
			where: { id: 'no-level' },
			data: { experience: 35, level: 3 },
		});
	});

	it('increments levels and carries over remaining experience', async () => {
		const user = createUser({ id: 'level-up', level: 1, experience: 154 });
		const result = await handleExperience(2, user);
		expect(result.isOk()).toBe(true);
		const updated = result.unwrap();
		expect(updated).not.toBe(false);
		if (updated === false) throw new Error('Expected a leveled up user');
		expect(updated).toMatchObject({ id: 'level-up', level: 2, experience: 1 });
		expect(prismaUpdate).toHaveBeenCalledWith({
			where: { id: 'level-up' },
			data: { experience: 1, level: 2 },
		});
	});

	it('returns err when the current level is invalid', async () => {
		const user = createUser({ id: 'bad-level', level: -5, experience: 0 });
		const result = await handleExperience(10, user);
		expect(result.isErr()).toBe(true);
		expect(prismaUpdate).not.toHaveBeenCalled();
	});
});
