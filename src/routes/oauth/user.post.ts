import { stringify } from 'node:querystring';
import { FetchResultTypes, fetch } from '@sapphire/fetch';
import { HttpCodes, Route, type MimeType } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';
import { OAuth2Routes, type RESTPostOAuth2AccessTokenResult } from 'discord.js';
import { authenticated, ratelimit } from '#lib/api/utils';

export class UserRoute extends Route {
	@authenticated()
	@ratelimit(Time.Minute * 5, 2, true)
	public async run(request: Route.Request, response: Route.Response) {
		const requestBody = (await request.readBodyJson()) as Record<string, string>;
		if (typeof requestBody.action !== 'string') {
			response.badRequest();
			return;
		}

		if (requestBody.action === 'SYNC_USER') {
			if (!request.auth) {
				response.error(HttpCodes.Unauthorized);
				return;
			}

			const auth = this.container.server.auth!;

			// If the token expires in a day, refresh
			let authToken = request.auth.token;
			if (Date.now() + Time.Day >= request.auth.expires) {
				const body = await this.refreshToken(request.auth.id, request.auth.refresh);
				if (body !== null) {
					const authentication = auth.encrypt({
						id: request.auth.id,
						token: body.access_token,
						refresh: body.refresh_token,
						expires: Date.now() + body.expires_in * 1_000,
					});

					response.cookies.add(auth.cookie, authentication, { maxAge: body.expires_in });
					authToken = body.access_token;
				}
			}

			try {
				response.json(await auth.fetchData(authToken));
				return;
			} catch (error) {
				this.container.logger.fatal(error);
				response.error(HttpCodes.InternalServerError);
				return;
			}
		}

		response.error(HttpCodes.BadRequest);
	}

	private async refreshToken(id: string, refreshToken: string) {
		const { logger, server } = this.container;
		try {
			logger.debug(`Refreshing Token for ${id}`);
			return await fetch<RESTPostOAuth2AccessTokenResult>(
				OAuth2Routes.tokenURL,
				{
					method: 'POST',
					body: stringify({
						client_id: server.auth!.id,
						client_secret: server.auth!.secret,
						grant_type: 'refresh_token',
						refresh_token: refreshToken,
						redirect_uri: server.auth!.redirect,
						scope: server.auth!.scopes,
					}),
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded' satisfies MimeType,
					},
				},
				FetchResultTypes.JSON,
			);
		} catch (error) {
			logger.fatal(error);
			return null;
		}
	}
}
