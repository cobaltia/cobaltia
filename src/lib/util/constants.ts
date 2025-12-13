import { URL } from 'node:url';
import { type SelectMenuComponentOptionData } from 'discord.js';

export const rootFolder = new URL('../../../', import.meta.url);
export const assetsFolder = new URL('assets/', rootFolder);

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

export const ROLES: SelectMenuComponentOptionData[] = [
	{ label: 'Stellaris', value: '463104258649227289' },
	{ label: 'HOI4', value: '505511934460821504' },
	{ label: 'DnD', value: '472271646330191903' },
	{ label: 'Moviegoer', value: '505506584907218944' },
	{ label: "Garry's Mod", value: '517410258373836811' },
	{ label: 'Professional Minecraft YouTuber', value: '547226455441014803' },
	{ label: 'Mapmen', value: '593809231388606464' },
	{ label: 'Warthunder', value: '593809290855448577' },
	{ label: 'M&B', value: '598709428874641419' },
	{ label: 'Stick Fight', value: '620081982830805002' },
	{ label: 'TF2', value: '629901488470228992' },
	{ label: 'Terraria', value: '711757027134668871' },
	{ label: 'Among Us', value: '754564411598962769' },
	{ label: 'Factorio', value: '792238974294032415' },
	{ label: 'Garfield Kart - Furious Racing', value: '892963957046902825' },
	{ label: 'Halo Infinite', value: '929895566924709888' },
	{ label: 'L4D2', value: '1053869548312469544' },
	{ label: 'Barotrauma', value: '1057492857704939655' },
	{ label: 'Lethal Company', value: '1183638483424792587' },
	{ label: "Baldur's Gate 3", value: '1166545225485926480' },
	{ label: 'Zomboid', value: '1212543350931071076' },
	{ label: 'Helldivers', value: '1212545695660376114' },
];

export const COBALT_GUILD_ID = '322505254098698240';
export const CONTROL_GUILD_ID = '823300821994569748';

export const enum ItemEmojis {
	Banknote = 'banknote',
	BrokenCandyCane = '🍬',
	CandyCane = 'candyCane',
	ChristmasGift2025 = 'christmasGift2025',
	Coal = 'coal',
	Cobuck = 'cobuck',
	GoldenNutcraker = '🪆',
	SantaHat = 'santaHat',
	SnowGlobe = 'snowGlobe',

	// eslint-disable-next-line typescript-sort-keys/string-enum
	Default = '',
}
