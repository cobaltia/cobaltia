import type { User as PrismaUser } from '@prisma/client';
import { container } from '@sapphire/framework';
import { type Option, none, some, ok, err, type Result } from '@sapphire/result';

export function nextLevel(level: number): Option<number> {
	if (level < 0) return none;
	return some(5 * level ** 2 + 50 * level + 100);
}

export async function handleExperience(
	experience: number,
	data: PrismaUser,
): Promise<Result<PrismaUser | false, Error>> {
	let currentLevel = data.level;
	let currentExperience = data.experience + experience;
	let leveledUp = false;

	while (true) {
		const requirement = nextLevel(currentLevel);
		if (requirement.isNone()) return err(new Error(`Level ${currentLevel} is not a valid level`));
		const nextLevelRequirement = requirement.unwrap();
		if (currentExperience < nextLevelRequirement) break;

		currentExperience -= nextLevelRequirement;
		currentLevel += 1;
		leveledUp = true;
	}

	const updated = await container.prisma.user.update({
		where: { id: data.id },
		data: { experience: currentExperience, level: currentLevel },
	});

	return leveledUp ? ok(updated) : ok(false);
}
