import { describe, expect, it } from 'vitest';
import { getDifference, truncate } from '#util/common/strings';

describe('getDifference', () => {
	it('returns unchanged text when strings match', () => {
		expect(getDifference('hello world', 'hello world')).toBe('hello world');
	});

	it('wraps additions and removals with discord formatting', () => {
		expect(getDifference('foo bar', 'foo baz')).toBe('foo ~~bar~~**baz**');
	});

	it('escapes markdown characters before diffing', () => {
		const diff = getDifference('**bold**', '**bold**!');
		expect(diff).toBe(String.raw`\*\*bold\*\***!**`);
	});
});

describe('truncate', () => {
	it('truncates strings that exceed the desired length', () => {
		expect(truncate('abcdef', 5)).toBe('ab...');
	});

	it('returns original string when under the desired length', () => {
		expect(truncate('abc', 5)).toBe('abc');
	});
});
