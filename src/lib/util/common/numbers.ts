/* eslint-disable id-length */
import { isNumber, roundNumber } from '@sapphire/utilities';

const suffixes = {
	k: 1e3,
	m: 1e6,
	b: 1e9,
	t: 1e12,
	'%': 1,
};

export type suffix = keyof typeof suffixes | '';

// eslint-disable-next-line prefer-named-capture-group
const NUMBER_SUFFIX = /^([\d.]+)([%bkmt]?)$/i;

export function formatNumber(num: number | string) {
	if (!isNumber(num)) return null;
	return Number.parseFloat(num.toString()).toLocaleString('en-US');
}

export function compactNumber(num: number | string) {
	if (!isNumber(num)) return null;
	const number = Number.parseFloat(num.toString());
	return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(number);
}

export function formatMoney(num: number | string, compact = false) {
	const result = compact ? compactNumber(num) : formatNumber(num);
	return result === null ? null : `₡ ${result}`;
}

export function addBonus(amount: number, bonus: number) {
	return roundNumber(amount + amount * (bonus / 100), 2);
}

export function getNumberWithSuffix(num: string) {
	const match = NUMBER_SUFFIX.exec(num);
	if (match === null) return null;
	const number = Number(match[1]);
	const suffix = match[2].toLowerCase() as suffix;
	return { number, suffix };
}

export function parseNumberWithSuffix(number: number, suffix: suffix) {
	return suffix === '' ? number : number * suffixes[suffix];
}

export function pickWeightedRandom(weights: number[]) {
	const list = [];
	for (const [i, weight] of weights.entries()) {
		for (let j = 0; j < weight; j++) {
			list.push(i);
		}
	}

	return list[Math.floor(Math.random() * list.length)];
}
