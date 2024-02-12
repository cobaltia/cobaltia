import { type Client, Prisma } from '@prisma/client';
import { container } from '@sapphire/framework';
import { Result, err } from '@sapphire/result';

export async function getClient(id: string): Promise<Result<Client, unknown>> {
	const result = await Result.fromAsync(async () => container.prisma.client.findUniqueOrThrow({ where: { id } }));

	if (result.isErr()) {
		const error = result.unwrapErr();
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) return err(error);
		return Result.fromAsync(async () => container.prisma.client.create({ data: { id } }));
	}

	return result;
}
