import { URL } from 'node:url';

export const rootFolder = new URL('../../../', import.meta.url);

export const enum Colors {
	Red = 0x8f0a0a,
	Green = 0x118511,
	Blue = 0x2f7db1,
	Yellow = 0xac8408,
	Black = 0x000000,
}

export const ONE_TO_TEN = new Map<number, string>([
	[1, '🥇'],
	[2, '🥈'],
	[3, '🥉'],
	[4, '4️⃣'],
	[5, '5️⃣'],
	[6, '6️⃣'],
	[7, '7️⃣'],
	[8, '8️⃣'],
	[9, '9️⃣'],
	[10, '🔟'],
]);
