import { type Inventory, Prisma } from '@prisma/client';
import { container } from '@sapphire/framework';
import { err, Result } from '@sapphire/result';

export async function getInventory(id: string): Promise<Result<Inventory, unknown>> {
	const result = await Result.fromAsync(async () => container.prisma.inventory.findUniqueOrThrow({ where: { id } }));

	if (result.isErr()) {
		const error = result.unwrapErr();
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) return err(error);
		return Result.fromAsync(async () => container.prisma.inventory.create({ data: { id } }));
	}

	return result;
}
