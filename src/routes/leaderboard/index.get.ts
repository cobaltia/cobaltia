import { Route } from '@sapphire/plugin-api';
import { DurationFormatter } from '@sapphire/time-utilities';
import {
	getGlobalBank,
	getGlobalLevel,
	getGlobalNetworth,
	getGlobalSocialCredit,
	getGlobalVcTime,
	getGlobalWallet,
} from '#lib/database';

export class UserRoute extends Route {
	public async run(request: Route.Request, response: Route.Response) {
		const query = request.query as Record<string, string>;
		const id = query.id ?? 'wallet';

		const limit = Number.parseInt(query.limit ?? '10', 10);
		const offset = Number.parseInt(query.offset ?? '0', 10);
		const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;
		const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

		switch (id) {
			case 'wallet':
				await this.handleWallet(safeLimit, safeOffset, response);
				break;
			case 'bank':
				await this.handleBank(safeLimit, safeOffset, response);
				break;
			case 'networth':
				await this.handleNetWorth(safeLimit, safeOffset, response);
				break;
			case 'level':
				await this.handleLevel(safeLimit, safeOffset, response);
				break;
			case 'socialcredit':
				await this.handleSocialCredit(safeLimit, safeOffset, response);
				break;
			case 'vctime':
				await this.handleVcTime(safeLimit, safeOffset, response);
				break;
			default:
				response.error(400, 'Invalid leaderboard id');
		}
	}

	private async handleWallet(limit: number, offset: number, response: Route.Response) {
		const result = await getGlobalWallet(limit, offset);
		if (result.isErr()) {
			response.error(500, 'Failed to fetch leaderboard data');
			return;
		}

		const data = result.unwrap();
		const leaderboard: { avatar: string; id: string; rank: number; tag: string; wallet: string }[] = [];

		const missing = data.filter(userData => !this.container.client.users.cache.has(userData.id));
		await Promise.all(missing.map(async userData => this.container.client.users.fetch(userData.id)));

		for (const [index, userData] of data.entries()) {
			const user = this.container.client.users.cache.get(userData.id);
			if (!user) continue;
			const wallet = userData.wallet.toString();
			leaderboard.push({
				id: user.id,
				tag: user.tag,
				avatar: user.avatarURL() ?? user.defaultAvatarURL,
				rank: index + 1 + offset,
				wallet,
			});
		}

		response.json(leaderboard);
	}

	private async handleBank(limit: number, offset: number, response: Route.Response) {
		const result = await getGlobalBank(limit, offset);
		if (result.isErr()) {
			response.error(500, 'Failed to fetch leaderboard data');
			return;
		}

		const data = result.unwrap();
		const leaderboard: { avatar: string; bank: string; id: string; rank: number; tag: string }[] = [];

		const missing = data.filter(userData => !this.container.client.users.cache.has(userData.id));
		await Promise.all(missing.map(async userData => this.container.client.users.fetch(userData.id)));

		for (const [index, userData] of data.entries()) {
			const user = this.container.client.users.cache.get(userData.id);
			if (!user) continue;
			const bank = userData.bankBalance.toString();
			leaderboard.push({
				id: user.id,
				tag: user.tag,
				avatar: user.avatarURL() ?? user.defaultAvatarURL,
				rank: index + 1 + offset,
				bank,
			});
		}

		response.json(leaderboard);
	}

	private async handleNetWorth(limit: number, offset: number, response: Route.Response) {
		const result = await getGlobalNetworth(limit, offset);
		if (result.isErr()) {
			response.error(500, 'Failed to fetch leaderboard data');
			return;
		}

		const data = result.unwrap();
		const leaderboard: { avatar: string; id: string; networth: string; rank: number; tag: string }[] = [];

		const missing = data.filter((userData: any) => !this.container.client.users.cache.has(userData.id));
		await Promise.all(missing.map(async (userData: any) => this.container.client.users.fetch(userData.id)));

		for (const [index, userData] of data.entries()) {
			const user = this.container.client.users.cache.get((userData as any).id);
			if (!user) continue;
			const networth = ((userData as any).net_worth ?? 0).toString();
			leaderboard.push({
				id: user.id,
				tag: user.tag,
				avatar: user.avatarURL() ?? user.defaultAvatarURL,
				rank: index + 1 + offset,
				networth,
			});
		}

		response.json(leaderboard);
	}

	private async handleLevel(limit: number, offset: number, response: Route.Response) {
		const result = await getGlobalLevel(limit, offset);
		if (result.isErr()) {
			response.error(500, 'Failed to fetch leaderboard data');
			return;
		}

		const data = result.unwrap();
		const leaderboard: { avatar: string; id: string; level: number; rank: number; tag: string }[] = [];

		const missing = data.filter(userData => !this.container.client.users.cache.has(userData.id));
		await Promise.all(missing.map(async userData => this.container.client.users.fetch(userData.id)));

		for (const [index, userData] of data.entries()) {
			const user = this.container.client.users.cache.get(userData.id);
			if (!user) continue;
			const level = userData.level;
			leaderboard.push({
				id: user.id,
				tag: user.tag,
				avatar: user.avatarURL() ?? user.defaultAvatarURL,
				rank: index + 1 + offset,
				level,
			});
		}

		response.json(leaderboard);
	}

	private async handleSocialCredit(limit: number, offset: number, response: Route.Response) {
		const result = await getGlobalSocialCredit(limit, offset);
		if (result.isErr()) {
			response.error(500, 'Failed to fetch leaderboard data');
			return;
		}

		const data = result.unwrap();
		const leaderboard: { avatar: string; id: string; rank: number; socialCredit: number; tag: string }[] = [];

		const missing = data.filter(userData => !this.container.client.users.cache.has(userData.id));
		await Promise.all(missing.map(async userData => this.container.client.users.fetch(userData.id)));

		for (const [index, userData] of data.entries()) {
			const user = this.container.client.users.cache.get(userData.id);
			if (!user) continue;
			const socialCredit = userData.socialCredit;
			leaderboard.push({
				id: user.id,
				tag: user.tag,
				avatar: user.avatarURL() ?? user.defaultAvatarURL,
				rank: index + 1 + offset,
				socialCredit,
			});
		}

		response.json(leaderboard);
	}

	private async handleVcTime(limit: number, offset: number, response: Route.Response) {
		const result = await getGlobalVcTime(limit, offset);
		if (result.isErr()) {
			response.error(500, 'Failed to fetch leaderboard data');
			return;
		}

		const data = result.unwrap();
		const leaderboard: { avatar: string; duration: string; id: string; rank: number; tag: string }[] = [];

		const missing = data.filter((userData: any) => !this.container.client.users.cache.has(userData.user_id));
		await Promise.all(missing.map(async (userData: any) => this.container.client.users.fetch(userData.user_id)));

		for (const [index, userData] of data.entries()) {
			const user = this.container.client.users.cache.get((userData as any).user_id);
			if (!user) continue;
			const voiceChatTime = (userData as any).total_duration;
			leaderboard.push({
				id: user.id,
				tag: user.tag,
				avatar: user.avatarURL() ?? user.defaultAvatarURL,
				rank: index + 1 + offset,
				duration: new DurationFormatter().format(Number(voiceChatTime)),
			});
		}

		response.json(leaderboard);
	}
}
