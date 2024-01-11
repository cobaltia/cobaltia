import { foo } from '#lib/index';

describe('index', () => {
	test('foo RETURNS foo', () => {
		expect(foo()).toBe('foo');
	});
});
