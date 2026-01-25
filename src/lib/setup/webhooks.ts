import { container } from '@sapphire/framework';
import { WebhookClient } from 'discord.js';
import { WEBHOOK_ERROR, WEBHOOK_LOG } from '#root/config';

container.webhookError = WEBHOOK_ERROR ? new WebhookClient(WEBHOOK_ERROR) : null;
container.webhookLog = WEBHOOK_LOG ? new WebhookClient(WEBHOOK_LOG) : null;

declare module '@sapphire/framework' {
	interface Container {
		webhookError: WebhookClient | null;
		webhookLog: WebhookClient | null;
	}
}
