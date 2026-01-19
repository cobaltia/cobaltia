import { Listener } from '@sapphire/framework';
import { type ApiRequest, type ApiResponse, ServerEvent } from '@sapphire/plugin-api';

export class ServerRequests extends Listener<typeof ServerEvent.Request> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			emitter: 'server',
			event: ServerEvent.Request,
		});
	}

	public async run(request: ApiRequest, response: ApiResponse) {
		const start = Date.now();

		// Basic request metadata
		const method = request.method ?? 'UNKNOWN';
		const url = request.url ?? '';
		const ip =
			(request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
			request.socket?.remoteAddress ??
			'unknown';

		// Log completion with status and latency
		response.once('finish', () => {
			const durationMs = Date.now() - start;
			const status = response.statusCode ?? 0;

			const msg = `${method} ${url} ${status} ${durationMs}ms ${ip}`;

			if (status >= 500) {
				this.container.logger.error(msg);
			} else if (status >= 400) {
				this.container.logger.warn(msg);
			} else {
				this.container.logger.info(msg);
			}
		});

		// Log stream errors if the response pipeline fails
		response.once('error', () => {
			const durationMs = Date.now() - start;
			this.container.logger.fatal(`${method} ${url} ${durationMs}ms ${ip}`);
		});
	}
}
