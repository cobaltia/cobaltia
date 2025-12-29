import { test, expect } from 'vitest';
import { nextLevel } from '#lib/util/experience';

test('nextLevel', () => {
	expect(nextLevel(0).unwrap()).toBe(100);
	expect(nextLevel(1).unwrap()).toBe(155);
	expect(nextLevel(2).unwrap()).toBe(220);
	expect(nextLevel(3).unwrap()).toBe(295);
	expect(nextLevel(4).unwrap()).toBe(380);
	expect(nextLevel(5).unwrap()).toBe(475);
	expect(nextLevel(-1).isNone()).toBe(true);
});
