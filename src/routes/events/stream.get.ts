import { clearInterval, setInterval } from 'node:timers';
import { Route } from '@sapphire/plugin-api';
import Redis from 'ioredis';
import { authenticated } from '#lib/api/utils';
import { REDIS_URI } from '#root/config';

export class UserRoute extends Route {
	@authenticated()
	public run(request: Route.Request, response: Route.Response) {
		response.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		});

		const subscriber = new Redis(REDIS_URI);

		// eslint-disable-next-line promise/prefer-await-to-then, promise/prefer-await-to-callbacks
		subscriber.subscribe('audit:events').catch(error => {
			this.container.logger.error('[SSE] Subscribe failed', error);
			response.end();
		});

		subscriber.on('message', (_channel: string, message: string) => {
			response.write(`data: ${message}\n\n`);
		});

		const heartbeat = setInterval(() => {
			response.write(': heartbeat\n\n');
		}, 30_000);

		request.on('close', () => {
			clearInterval(heartbeat);
			// eslint-disable-next-line promise/prefer-await-to-then
			subscriber.unsubscribe().catch(() => {});
			subscriber.disconnect();
		});
	}
}
