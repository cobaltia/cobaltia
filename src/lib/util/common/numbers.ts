import { isNumber, roundNumber } from '@sapphire/utilities';

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
	return roundNumber(amount + amount * bonus);
}
