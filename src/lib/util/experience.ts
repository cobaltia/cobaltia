import type { User as PrismaUser } from '@prisma/client';
import { container } from '@sapphire/framework';
import { type Option, none, some, ok, err, type Result } from '@sapphire/result';

export function nextLevel(level: number): Option<number> {
	if (level < 0) return none;
	return some(5 * level ** 2 + 50 * level + 100);
}

// TODO(Isidro): Make sure that I give the user the correct amount of levels not just one
export async function handleExperience(
	experience: number,
	data: PrismaUser,
): Promise<Result<PrismaUser | false, Error>> {
	const result = nextLevel(data.level);
	if (result.isNone()) return err(new Error(`Level ${data.level} is not a valid level`));
	const nextLvl = result.unwrap();

	if (data.experience + experience >= nextLvl) {
		const newExp = data.experience - nextLvl + experience;
		const next = await container.prisma.user.update({
			where: { id: data.id },
			data: { experience: newExp, level: data.level + 1 },
		});
		return ok(next);
	} else {
		await container.prisma.user.update({
			where: { id: data.id },
			data: { experience: data.experience + experience },
		});
		return ok(false);
	}
}
