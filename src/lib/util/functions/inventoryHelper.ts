import { container } from '@sapphire/framework';
import { none, type Option, Result, some } from '@sapphire/result';

export async function getInventory(userId: string): Promise<Option<Map<string, number>>> {
	const result = await Result.fromAsync(async () => container.prisma.inventory.findMany({ where: { userId } }));

	const inventory = result.unwrap();

	if (!inventory) {
		return none;
	}

	return some(new Map(inventory.map(item => [item.itemId, item.quantity])));
}

export async function getInventoryNetWorth(userId: string): Promise<number> {
	const items = container.stores.get('items');
	const data = await getInventory(userId);
	if (data.isNone()) return 0;

	const inventory = data.unwrap();
	let netWorth = 0;

	for (const [key, value] of inventory) {
		const item = items.get(key);
		if (!item) continue;

		netWorth += item.price * value;
	}

	return netWorth;
}
