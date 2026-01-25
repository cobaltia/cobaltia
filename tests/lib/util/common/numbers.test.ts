import type { Decimal } from '@prisma/client/runtime/library';
import { describe, expect, it, afterEach, vi } from 'vitest';
import {
	addBonus,
	compactNumber,
	formatMoney,
	formatNumber,
	getNumberWithSuffix,
	parseNumberWithSuffix,
	pickWeightedRandom,
} from '#util/common/numbers';

describe('formatNumber', () => {
	it('formats plain numbers with thousands separators', () => {
		expect(formatNumber(1_234.56)).toBe('1,234.56');
	});

	it('formats Prisma Decimal-like values', () => {
		const decimal = { toNumber: () => 98_765.432_1 } as Decimal;
		expect(formatNumber(decimal)).toBe('98,765.432');
	});

	it('returns null for non-numeric input', () => {
		expect(formatNumber('not-a-number')).toBeNull();
	});
});

describe('compactNumber', () => {
	it('compacts thousands', () => {
		expect(compactNumber(1_234)).toBe('1.2K');
	});

	it('falls back to normal numbers below threshold', () => {
		expect(compactNumber(123)).toBe('123');
	});
});

describe('formatMoney', () => {
	it('formats with currency symbol in standard mode', () => {
		expect(formatMoney(1_500)).toBe('₡ 1,500');
	});

	it('formats with currency symbol in compact mode', () => {
		expect(formatMoney(1_500, true)).toBe('₡ 1.5K');
	});

	it('returns null when input is not numeric', () => {
		expect(formatMoney('oops')).toBeNull();
	});
});

describe('addBonus', () => {
	it('applies percentage bonus with two decimal rounding', () => {
		expect(addBonus(123.45, 12.5)).toBe(138.88);
	});
});

describe('getNumberWithSuffix', () => {
	it('extracts number and suffix (case-insensitive)', () => {
		expect(getNumberWithSuffix('2.5M')).toEqual({ number: 2.5, suffix: 'm' });
	});

	it('returns null for invalid patterns', () => {
		expect(getNumberWithSuffix('foo42')).toBeNull();
	});
});

describe('parseNumberWithSuffix', () => {
	it('converts using suffix multiplier', () => {
		expect(parseNumberWithSuffix(2, 'k')).toBe(2_000);
	});

	it('returns original value when no suffix is provided', () => {
		expect(parseNumberWithSuffix(42, '')).toBe(42);
	});
});

describe('pickWeightedRandom', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns indices proportional to weights (lower bound)', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		expect(pickWeightedRandom([1, 3])).toBe(0);
	});

	it('returns indices proportional to weights (upper segments)', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.99);
		expect(pickWeightedRandom([1, 3])).toBe(1);
	});
});
