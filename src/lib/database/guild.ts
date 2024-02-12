import { Prisma, type Guild } from '@prisma/client';
import { container } from '@sapphire/framework';
import { Result, err } from '@sapphire/result';

export async function getGuild(id: string): Promise<Result<Guild, unknown>> {
	const result = await Result.fromAsync(async () => container.prisma.guild.findUniqueOrThrow({ where: { id } }));

	if (result.isErr()) {
		const error = result.unwrapErr();
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) return err(error);
		return Result.fromAsync(async () => container.prisma.guild.create({ data: { id } }));
	}

	return result;
}
